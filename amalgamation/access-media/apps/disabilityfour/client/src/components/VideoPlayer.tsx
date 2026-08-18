import { useEffect, useRef, useState } from "react";

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  poster?: string;
  captions?: Array<{
    src: string;
    srclang: string;
    label: string;
    kind?: "subtitles" | "captions" | "descriptions";
  }>;
  transcriptDiv?: string;
  autoplay?: boolean;
  startTime?: number;
}

declare global {
  interface Window {
    AblePlayer: any;
  }
}

export function VideoPlayer({
  videoUrl,
  title,
  poster,
  captions = [],
  transcriptDiv,
  autoplay = false,
  startTime = 0,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerInstanceRef = useRef<any>(null);
  const [playerReady, setPlayerReady] = useState(false);

  useEffect(() => {
    const initializePlayer = () => {
      if (!videoRef.current) return;
      
      if (typeof window.AblePlayer !== "undefined") {
        try {
          playerInstanceRef.current = new window.AblePlayer(videoRef.current);
          setPlayerReady(true);
        } catch (error) {
          console.error("Error initializing Able Player:", error);
        }
      } else {
        const checkInterval = setInterval(() => {
          if (typeof window.AblePlayer !== "undefined") {
            clearInterval(checkInterval);
            try {
              playerInstanceRef.current = new window.AblePlayer(videoRef.current);
              setPlayerReady(true);
            } catch (error) {
              console.error("Error initializing Able Player:", error);
            }
          }
        }, 100);

        setTimeout(() => clearInterval(checkInterval), 5000);
      }
    };

    initializePlayer();

    return () => {
      if (playerInstanceRef.current && playerInstanceRef.current.destroy) {
        try {
          playerInstanceRef.current.destroy();
        } catch (error) {
          console.error("Error destroying Able Player:", error);
        }
      }
    };
  }, [videoUrl]);

  return (
    <div className="able-player-wrapper">
      <video
        ref={videoRef}
        data-able-player
        data-transcript-div={transcriptDiv}
        data-autoplay={autoplay}
        data-start-time={startTime}
        data-use-chapters-button="true"
        data-seek-interval="10"
        data-volume="80"
        data-help-button="true"
        data-keyboard-help="true"
        preload="auto"
        poster={poster}
        data-testid="able-player-video"
      >
        <source src={videoUrl} type="video/mp4" />
        
        {captions.map((caption, index) => (
          <track
            key={index}
            kind={caption.kind || "captions"}
            src={caption.src}
            srcLang={caption.srclang}
            label={caption.label}
            default={index === 0}
          />
        ))}
        
        <p className="text-white text-sm">
          Your browser does not support HTML5 video. Please use a modern browser to view this content.
        </p>
      </video>
    </div>
  );
}
