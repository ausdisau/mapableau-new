import type { Content, Category } from "@shared/schema";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
const MAX_RESULTS = 50;

export class YouTubeAPIError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = "YouTubeAPIError";
  }
}

export class ChannelNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChannelNotFoundError";
  }
}

export class InvalidAPIKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidAPIKeyError";
  }
}

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  duration: string; // ISO 8601
  channelTitle: string;
}

interface YouTubeChannelResponse {
  items?: Array<{
    id: string;
    contentDetails: {
      relatedPlaylists: {
        uploads: string;
      };
    };
    snippet: {
      title: string;
    };
  }>;
}

interface YouTubePlaylistItemsResponse {
  items?: Array<{
    snippet: {
      resourceId: {
        videoId: string;
      };
      title: string;
      description: string;
      publishedAt: string;
      thumbnails: {
        maxres?: { url: string };
        high?: { url: string };
        medium?: { url: string };
        default?: { url: string };
      };
      channelTitle: string;
    };
  }>;
  nextPageToken?: string;
}

interface YouTubeVideosResponse {
  items?: Array<{
    id: string;
    contentDetails: {
      duration: string; // ISO 8601 format
    };
  }>;
}

interface YouTubeErrorResponse {
  error?: {
    code?: number;
    message?: string;
    errors?: Array<{
      domain?: string;
      reason?: string;
      message?: string;
    }>;
    details?: Array<{
      reason?: string;
      domain?: string;
      metadata?: Record<string, string>;
    }>;
  };
}

/**
 * Categorizes a video based on its title and description using keyword matching
 */
export function categorizeVideo(title: string, description: string): Category {
  const text = `${title} ${description}`.toLowerCase();

  // Keywords for each category
  const newsKeywords = [
    "news", "update", "announcement", "breaking", "report", "alert",
    "policy", "government", "legislation", "current affairs", "bulletin"
  ];

  const sportsKeywords = [
    "sport", "paralympic", "athlete", "competition", "game", "match",
    "championship", "tournament", "adaptive sport", "wheelchair", "racing"
  ];

  // Check for News category
  if (newsKeywords.some(keyword => text.includes(keyword))) {
    return "News";
  }

  // Check for Sports category
  if (sportsKeywords.some(keyword => text.includes(keyword))) {
    return "Sports";
  }

  // Default to Documentary for educational content, awareness campaigns, personal stories, advocacy
  return "Documentary";
}

/**
 * Parses ISO 8601 duration format (e.g., PT1H30M45S) to minutes
 */
function parseDurationToMinutes(isoDuration: string): number {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);

  return hours * 60 + minutes + Math.ceil(seconds / 60);
}

/**
 * Checks if a YouTube API error is an invalid API key error
 * @param errorData - Parsed YouTube API error response
 * @returns true if the error is due to an invalid API key
 */
function isInvalidAPIKeyError(errorData: YouTubeErrorResponse): boolean {
  const reason = errorData.error?.errors?.[0]?.reason || errorData.error?.details?.[0]?.reason;
  
  // YouTube API returns these reasons for invalid API keys
  const invalidKeyReasons = [
    'keyInvalid',
    'badRequest',
  ];
  
  // Also check the error message for common invalid key patterns
  const errorMessage = errorData.error?.message?.toLowerCase() || '';
  const hasInvalidKeyMessage = 
    errorMessage.includes('api key not valid') ||
    errorMessage.includes('api key invalid') ||
    errorMessage.includes('invalid api key');
  
  return (reason !== undefined && invalidKeyReasons.includes(reason)) || hasInvalidKeyMessage;
}

/**
 * Fetches video durations from YouTube API
 * @throws InvalidAPIKeyError when API key is invalid or missing (403 with invalid key reason)
 * @throws YouTubeAPIError for quota exceeded and other API failures (403 with quota reason, etc.)
 */
async function fetchVideoDurations(
  videoIds: string[],
  apiKey: string
): Promise<Map<string, string>> {
  const durationsMap = new Map<string, string>();

  // YouTube API allows up to 50 video IDs per request
  const batchSize = 50;
  for (let i = 0; i < videoIds.length; i += batchSize) {
    const batch = videoIds.slice(i, i + batchSize);
    const url = `${YOUTUBE_API_BASE}/videos?part=contentDetails&id=${batch.join(",")}&key=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      
      // For 403 errors, parse JSON to distinguish between invalid key and quota exceeded
      if (response.status === 403) {
        try {
          const errorData: YouTubeErrorResponse = JSON.parse(errorText);
          
          if (isInvalidAPIKeyError(errorData)) {
            throw new InvalidAPIKeyError(`Invalid or missing YouTube API key: ${errorData.error?.message || errorText}`);
          }
          
          // Quota exceeded or other 403 errors should throw YouTubeAPIError
          const reason = errorData.error?.errors?.[0]?.reason || errorData.error?.details?.[0]?.reason || 'unknown';
          throw new YouTubeAPIError(
            `YouTube API error (${reason}): ${errorData.error?.message || errorText}`,
            response.status
          );
        } catch (parseError) {
          // If JSON parsing fails, fall back to text-based detection
          if (errorText.toLowerCase().includes("invalid api key") || errorText.toLowerCase().includes("api key not valid")) {
            throw new InvalidAPIKeyError(`Invalid or missing YouTube API key: ${errorText}`);
          }
          throw new YouTubeAPIError(`YouTube API error: ${response.status} ${response.statusText}. ${errorText}`, response.status);
        }
      }
      
      throw new YouTubeAPIError(`Failed to fetch video durations: ${response.status} ${response.statusText}. ${errorText}`, response.status);
    }

    const data: YouTubeVideosResponse = await response.json();
    
    if (data.items) {
      for (const item of data.items) {
        durationsMap.set(item.id, item.contentDetails.duration);
      }
    }
  }

  return durationsMap;
}

/**
 * Resolves a YouTube channel handle (e.g., @ausdisau) to channel ID and uploads playlist ID
 * @throws InvalidAPIKeyError when API key is invalid or missing (403 with invalid key reason)
 * @throws ChannelNotFoundError when channel is not found (empty items array)
 * @throws YouTubeAPIError for quota exceeded and other API failures (403 with quota reason, etc.)
 */
async function resolveChannelHandle(
  handle: string,
  apiKey: string
): Promise<{ channelId: string; uploadsPlaylistId: string; channelTitle: string }> {
  // Remove @ if present
  const cleanHandle = handle.startsWith("@") ? handle.substring(1) : handle;

  const url = `${YOUTUBE_API_BASE}/channels?part=contentDetails,snippet&forHandle=${cleanHandle}&key=${apiKey}`;

  const response = await fetch(url);
  
  if (!response.ok) {
    const errorText = await response.text();
    
    // For 403 errors, parse JSON to distinguish between invalid key and quota exceeded
    if (response.status === 403) {
      try {
        const errorData: YouTubeErrorResponse = JSON.parse(errorText);
        
        if (isInvalidAPIKeyError(errorData)) {
          throw new InvalidAPIKeyError(`Invalid or missing YouTube API key: ${errorData.error?.message || errorText}`);
        }
        
        // Quota exceeded or other 403 errors should throw YouTubeAPIError
        const reason = errorData.error?.errors?.[0]?.reason || errorData.error?.details?.[0]?.reason || 'unknown';
        throw new YouTubeAPIError(
          `YouTube API error (${reason}): ${errorData.error?.message || errorText}`,
          response.status
        );
      } catch (parseError) {
        // If JSON parsing fails, fall back to text-based detection
        if (errorText.toLowerCase().includes("invalid api key") || errorText.toLowerCase().includes("api key not valid")) {
          throw new InvalidAPIKeyError(`Invalid or missing YouTube API key: ${errorText}`);
        }
        throw new YouTubeAPIError(`YouTube API error: ${response.status} ${response.statusText}. ${errorText}`, response.status);
      }
    } else if (response.status === 400) {
      throw new YouTubeAPIError(`YouTube API bad request for handle ${handle}: ${response.status} ${response.statusText}. ${errorText}`, response.status);
    } else {
      throw new YouTubeAPIError(`YouTube API error: ${response.status} ${response.statusText}. ${errorText}`, response.status);
    }
  }

  const data: YouTubeChannelResponse = await response.json();

  if (!data.items || data.items.length === 0) {
    throw new ChannelNotFoundError(`Channel not found: ${handle}. The channel may not exist or the handle may be incorrect.`);
  }

  const channel = data.items[0];
  return {
    channelId: channel.id,
    uploadsPlaylistId: channel.contentDetails.relatedPlaylists.uploads,
    channelTitle: channel.snippet.title,
  };
}

/**
 * Fetches videos from a YouTube playlist (uploads playlist)
 * @throws InvalidAPIKeyError when API key is invalid or missing (403 with invalid key reason)
 * @throws YouTubeAPIError for quota exceeded and other API failures (403 with quota reason, etc.)
 */
async function fetchPlaylistVideos(
  playlistId: string,
  apiKey: string,
  maxResults: number = MAX_RESULTS
): Promise<YouTubeVideo[]> {
  const videos: YouTubeVideo[] = [];
  let pageToken: string | undefined;
  let totalFetched = 0;

  while (totalFetched < maxResults) {
    const resultsToFetch = Math.min(50, maxResults - totalFetched); // API max is 50 per request
    let url = `${YOUTUBE_API_BASE}/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=${resultsToFetch}&key=${apiKey}`;
    
    if (pageToken) {
      url += `&pageToken=${pageToken}`;
    }

    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      
      // For 403 errors, parse JSON to distinguish between invalid key and quota exceeded
      if (response.status === 403) {
        try {
          const errorData: YouTubeErrorResponse = JSON.parse(errorText);
          
          if (isInvalidAPIKeyError(errorData)) {
            throw new InvalidAPIKeyError(`Invalid or missing YouTube API key: ${errorData.error?.message || errorText}`);
          }
          
          // Quota exceeded or other 403 errors should throw YouTubeAPIError
          const reason = errorData.error?.errors?.[0]?.reason || errorData.error?.details?.[0]?.reason || 'unknown';
          throw new YouTubeAPIError(
            `YouTube API error (${reason}): ${errorData.error?.message || errorText}`,
            response.status
          );
        } catch (parseError) {
          // If JSON parsing fails, fall back to text-based detection
          if (errorText.toLowerCase().includes("invalid api key") || errorText.toLowerCase().includes("api key not valid")) {
            throw new InvalidAPIKeyError(`Invalid or missing YouTube API key: ${errorText}`);
          }
          throw new YouTubeAPIError(`YouTube API error: ${response.status} ${response.statusText}. ${errorText}`, response.status);
        }
      } else {
        throw new YouTubeAPIError(`YouTube API error: ${response.status} ${response.statusText}. ${errorText}`, response.status);
      }
    }

    const data: YouTubePlaylistItemsResponse = await response.json();

    if (!data.items || data.items.length === 0) {
      break;
    }

    // Extract video data
    for (const item of data.items) {
      const { snippet } = item;
      const thumbnails = snippet.thumbnails;
      
      // Prefer maxres, then high, then medium, then default
      const thumbnail = 
        thumbnails.maxres?.url || 
        thumbnails.high?.url || 
        thumbnails.medium?.url || 
        thumbnails.default?.url || 
        "";

      videos.push({
        id: snippet.resourceId.videoId,
        title: snippet.title,
        description: snippet.description || "",
        thumbnail,
        publishedAt: snippet.publishedAt,
        duration: "", // Will be filled later
        channelTitle: snippet.channelTitle,
      });
    }

    totalFetched += data.items.length;
    pageToken = data.nextPageToken;

    // Break if no more pages or reached max results
    if (!pageToken || totalFetched >= maxResults) {
      break;
    }
  }

  // Fetch durations for all videos
  if (videos.length > 0) {
    const videoIds = videos.map(v => v.id);
    const durationsMap = await fetchVideoDurations(videoIds, apiKey);
    
    // Update videos with durations
    for (const video of videos) {
      video.duration = durationsMap.get(video.id) || "PT0M";
    }
  }

  return videos;
}

/**
 * Transforms YouTube video data to platform Content format
 */
function transformToContent(video: YouTubeVideo): Omit<Content, "id"> {
  const category = categorizeVideo(video.title, video.description);
  const duration = parseDurationToMinutes(video.duration);
  const year = new Date(video.publishedAt).getFullYear();

  return {
    title: video.title,
    description: video.description,
    thumbnail: video.thumbnail,
    category,
    tier: "FREE",
    contentType: "movie",
    duration,
    featured: false,
    episodeCount: null,
    year,
    youtubeVideoId: video.id,
    source: "youtube",
    channelName: video.channelTitle,
  };
}

/**
 * Fetches videos from a YouTube channel and converts them to Content format
 * 
 * @param channelHandle - YouTube channel handle (e.g., "@ausdisau")
 * @returns Array of Content objects ready for database insertion
 * @throws InvalidAPIKeyError when API key is missing or invalid
 * @throws ChannelNotFoundError when channel cannot be found
 * @throws YouTubeAPIError for other YouTube API failures
 */
export async function fetchChannelVideos(channelHandle: string): Promise<Omit<Content, "id">[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    throw new InvalidAPIKeyError("YOUTUBE_API_KEY environment variable is not set");
  }

  // Step 1: Resolve channel handle to get uploads playlist ID
  const channelInfo = await resolveChannelHandle(channelHandle, apiKey);

  console.log(`Fetching videos from channel: ${channelInfo.channelTitle}`);

  // Step 2: Fetch videos from uploads playlist
  const videos = await fetchPlaylistVideos(
    channelInfo.uploadsPlaylistId,
    apiKey,
    MAX_RESULTS
  );

  if (videos.length === 0) {
    console.log(`No videos found for channel: ${channelHandle}`);
    return [];
  }

  console.log(`Successfully fetched ${videos.length} videos from ${channelInfo.channelTitle}`);

  // Step 3: Transform to Content format
  const content = videos.map(transformToContent);

  return content;
}
