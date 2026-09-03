"use client";

import {
  Accessibility,
  ArrowRight,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  CarFront,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  Clapperboard,
  Clock3,
  Coffee,
  Contrast,
  Download,
  Eye,
  Filter,
  Heart,
  Hospital,
  Map,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Star,
  Trees,
  Type,
  UsersRound,
  Volume2,
  Wifi,
  WifiOff,
  X,
  type LucideIcon,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

type Tab = "map" | "care" | "transport" | "jobs" | "profile";
type TextSize = "normal" | "large" | "xlarge";
type FlowType = "care" | "transport" | "job";

type Venue = {
  id: number;
  name: string;
  category: string;
  rating: number;
  reviews: number;
  access: "Full" | "Partial";
  distance: string;
  tags: string[];
  icon: LucideIcon;
  position: [number, number];
};

type CareProvider = {
  id: number;
  name: string;
  initials: string;
  role: string;
  rating: number;
  reviews: number;
  rate: string;
  tags: string[];
  colour: string;
};

type TransportOption = {
  id: number;
  type: string;
  eta: string;
  price: string;
  capacity: string;
  icon: LucideIcon;
};

type Job = {
  id: number;
  title: string;
  company: string;
  tags: string[];
  match: number;
};

type BookingItem = CareProvider | TransportOption | Job;

type Suggestion = {
  title: string;
  body: string;
  cta: string;
  action: () => void;
};

const VENUES: Venue[] = [
  {
    id: 1,
    name: "Riverside CafÃ©",
    category: "CafÃ©",
    rating: 4.8,
    reviews: 62,
    access: "Full",
    distance: "0.4 km",
    tags: ["Step-free entry", "Accessible toilet", "Wide aisles"],
    icon: Coffee,
    position: [15, 35],
  },
  {
    id: 2,
    name: "State Library",
    category: "Library",
    rating: 4.9,
    reviews: 140,
    access: "Full",
    distance: "0.9 km",
    tags: ["Lift access", "Braille signage", "Quiet room"],
    icon: BookOpen,
    position: [34, 62],
  },
  {
    id: 3,
    name: "Harbourview Cinema",
    category: "Cinema",
    rating: 4.3,
    reviews: 88,
    access: "Partial",
    distance: "1.2 km",
    tags: ["Wheelchair bays", "Captioned sessions"],
    icon: Clapperboard,
    position: [56, 30],
  },
  {
    id: 4,
    name: "Green Park Playground",
    category: "Park",
    rating: 4.6,
    reviews: 41,
    access: "Full",
    distance: "0.6 km",
    tags: ["Accessible swings", "Rubber pathways"],
    icon: Trees,
    position: [72, 69],
  },
  {
    id: 5,
    name: "Central Medical Centre",
    category: "Health",
    rating: 4.5,
    reviews: 97,
    access: "Full",
    distance: "1.5 km",
    tags: ["Ramp entry", "Accessible parking"],
    icon: Hospital,
    position: [87, 39],
  },
];

const CARE_PROVIDERS: CareProvider[] = [
  {
    id: 1,
    name: "Amara T.",
    initials: "AT",
    role: "Personal care support",
    rating: 4.9,
    reviews: 54,
    rate: "$68/hr",
    tags: ["NDIS registered", "First aid certified"],
    colour: "bg-[#ef8354]",
  },
  {
    id: 2,
    name: "Daniel K.",
    initials: "DK",
    role: "Community access support",
    rating: 4.8,
    reviews: 39,
    rate: "$62/hr",
    tags: ["Auslan basics", "Accessible vehicle"],
    colour: "bg-[#277da1]",
  },
  {
    id: 3,
    name: "Priya R.",
    initials: "PR",
    role: "Allied health assistant",
    rating: 5,
    reviews: 71,
    rate: "$74/hr",
    tags: ["OT background", "Evenings available"],
    colour: "bg-[#43aa8b]",
  },
];

const TRANSPORT_OPTIONS: TransportOption[] = [
  {
    id: 1,
    type: "Accessible sedan",
    eta: "6 min",
    price: "$14â€“18",
    capacity: "1 folding wheelchair",
    icon: CarFront,
  },
  {
    id: 2,
    type: "WAV van",
    eta: "11 min",
    price: "$22â€“28",
    capacity: "Full wheelchair and hoist",
    icon: Accessibility,
  },
  {
    id: 3,
    type: "Community transport",
    eta: "25 min",
    price: "NDIS funded",
    capacity: "Shared and scheduled",
    icon: UsersRound,
  },
];

const JOBS: Job[] = [
  {
    id: 1,
    title: "Data Entry Assistant (Remote)",
    company: "Northlight Admin Co.",
    tags: ["Remote", "Flexible hours"],
    match: 92,
  },
  {
    id: 2,
    title: "Library Assistant",
    company: "City of Parramatta",
    tags: ["Step-free site", "Part-time"],
    match: 87,
  },
  {
    id: 3,
    title: "Customer Support Officer",
    company: "Aurora Retail Group",
    tags: ["Hybrid", "Assistive tech provided"],
    match: 81,
  },
];

const NAV_ITEMS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "map", label: "Explore", icon: Map },
  { id: "care", label: "Care", icon: UsersRound },
  { id: "transport", label: "Transport", icon: CarFront },
  { id: "jobs", label: "Jobs", icon: BriefcaseBusiness },
  { id: "profile", label: "Profile", icon: CircleUserRound },
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function Badge({
  children,
  tone = "neutral",
  highContrast = false,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "green" | "amber" | "blue" | "coral";
  highContrast?: boolean;
}) {
  const tones = {
    neutral: "bg-[#edf2ef] text-[#49635a]",
    green: "bg-[#dff5e9] text-[#126246]",
    amber: "bg-[#fff0cd] text-[#7a4b00]",
    blue: "bg-[#e1f1f5] text-[#19576b]",
    coral: "bg-[#ffebe4] text-[#9f3f1f]",
  };

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold leading-none",
        highContrast
          ? "border border-white/35 bg-white/10 text-white"
          : tones[tone],
      )}
    >
      {children}
    </span>
  );
}

function StarRating({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-current/60">
      <Star
        aria-hidden="true"
        className="fill-[#f9b44d] text-[#f9b44d]"
        size={14}
      />
      <span className="font-extrabold text-current">{rating.toFixed(1)}</span>
      <span>({reviews})</span>
    </span>
  );
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 3200);
    return () => window.clearTimeout(timer);
  }, [message, onClose]);

  return (
    <div
      aria-live="polite"
      className="fixed bottom-24 left-1/2 z-[70] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 md:bottom-8"
    >
      <div className="flex items-center gap-3 rounded-2xl bg-[#163d35] px-4 py-3.5 text-white shadow-[0_20px_60px_rgba(12,40,32,0.3)]">
        <CheckCircle2 className="shrink-0 text-[#78e2b8]" size={19} />
        <span className="text-sm font-bold">{message}</span>
      </div>
    </div>
  );
}

function useEscape(onEscape: () => void) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onEscape();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onEscape]);
}

export function MapAbleApp() {
  const [tab, setTab] = useState<Tab>("map");
  const [textSize, setTextSize] = useState<TextSize>("normal");
  const [highContrast, setHighContrast] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showInstall, setShowInstall] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [bookingFlow, setBookingFlow] = useState<{
    type: FlowType;
    item: BookingItem;
  } | null>(null);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const textClasses: Record<TextSize, string> = {
    normal: "",
    large:
      "[&_.text-xs]:text-sm [&_.text-sm]:text-base [&_.text-lg]:text-xl [&_.text-2xl]:text-3xl",
    xlarge:
      "[&_.text-xs]:text-base [&_.text-sm]:text-lg [&_.text-lg]:text-2xl [&_.text-2xl]:text-4xl",
  };

  const fireToast = (message: string) => setToast(message);

  const selectTab = (nextTab: Tab) => {
    setTab(nextTab);
    setNotificationsOpen(false);
  };

  const handleBookingComplete = (type: FlowType) => {
    setBookingFlow(null);
    if (type === "care") {
      fireToast("Support worker booked for Thursday at 10:00 am");
      setSuggestion({
        title: "Need a ride there too?",
        body: "Book accessible transport to your appointment in one tap.",
        cta: "Book transport",
        action: () => {
          setSuggestion(null);
          setTab("transport");
        },
      });
    } else if (type === "transport") {
      fireToast("Ride confirmed â€” arriving in 6 minutes");
      setSuggestion(null);
    } else {
      fireToast("Application submitted successfully");
      setSuggestion({
        title: "Prepare with confidence",
        body: "Explore NDIS-funded interview coaching from a MapAble specialist.",
        cta: "Explore support",
        action: () => {
          setSuggestion(null);
          setTab("care");
        },
      });
    }
  };

  return (
    <div
      className={cx(
        "relative flex min-h-dvh w-full flex-col overflow-hidden transition-colors duration-300",
        highContrast ? "bg-black text-white" : "bg-[#f3f7f4] text-[#173f36]",
        textClasses[textSize],
      )}
    >
      {!highContrast && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_12%_8%,rgba(88,190,152,0.14),transparent_26%),radial-gradient(circle_at_86%_20%,rgba(239,131,84,0.11),transparent_24%)]"
        />
      )}

      {!isOnline && (
        <div className="relative z-50 flex items-center justify-center gap-2 bg-[#bc5d35] px-4 py-2 text-center text-xs font-bold text-white">
          <WifiOff size={14} /> Youâ€™re offline â€” showing saved information
        </div>
      )}

      {showInstall && (
        <div
          className={cx(
            "relative z-40 flex items-center justify-between gap-3 border-b px-4 py-2.5",
            highContrast
              ? "border-white/20 bg-black"
              : "border-[#d9e4df] bg-white/95",
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            <LogoMark compact />
            <p className="truncate text-xs font-bold">
              Install MapAble for offline access and faster booking
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              className="flex min-h-9 items-center gap-1.5 rounded-full bg-[#e66e3f] px-3 text-xs font-extrabold text-white transition hover:bg-[#c6532b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e66e3f]"
              onClick={() => {
                setShowInstall(false);
                fireToast("MapAble added to your home screen");
              }}
              type="button"
            >
              <Download size={13} /> Install
            </button>
            <IconButton
              highContrast={highContrast}
              label="Dismiss install prompt"
              onClick={() => setShowInstall(false)}
            >
              <X size={16} />
            </IconButton>
          </div>
        </div>
      )}

      <header
        className={cx(
          "relative z-30 flex items-center gap-3 border-b px-4 py-3 backdrop-blur-xl",
          highContrast
            ? "border-white/20 bg-black/95"
            : "border-[#d9e4df] bg-[#f8fbf9]/90",
        )}
      >
        <div className="flex items-center gap-2.5">
          <LogoMark />
          <div className="hidden leading-none sm:block">
            <span className="font-heading text-lg font-extrabold tracking-[-0.035em]">
              MapAble
            </span>
            <span className="mt-1 block text-[9px] font-extrabold uppercase tracking-[0.22em] opacity-55">
              Life, connected
            </span>
          </div>
        </div>

        <label
          className={cx(
            "mx-auto flex max-w-2xl flex-1 items-center gap-2.5 rounded-full border px-4 py-2.5 transition focus-within:ring-2 focus-within:ring-[#2b8c73]",
            highContrast
              ? "border-white/30 bg-white/10"
              : "border-[#d8e4de] bg-white shadow-sm",
          )}
        >
          <Search
            aria-hidden="true"
            className="shrink-0 opacity-45"
            size={17}
          />
          <span className="sr-only">Search MapAble</span>
          <input
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:font-medium placeholder:text-current/40"
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Places, support, rides, jobsâ€¦"
            value={searchQuery}
          />
          {searchQuery && (
            <button
              aria-label="Clear search"
              className="rounded-full p-1 opacity-50 hover:opacity-100"
              onClick={() => setSearchQuery("")}
              type="button"
            >
              <X size={14} />
            </button>
          )}
        </label>

        <div className="flex items-center">
          <IconButton
            highContrast={highContrast}
            label="Notifications"
            onClick={() => setNotificationsOpen((open) => !open)}
            pressed={notificationsOpen}
          >
            <Bell size={19} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#e66e3f] ring-2 ring-white" />
          </IconButton>
          <IconButton
            highContrast={highContrast}
            label="Accessibility settings"
            onClick={() => setShowSettings(true)}
          >
            <Settings2 size={19} />
          </IconButton>
        </div>
      </header>

      {notificationsOpen && (
        <NotificationsPanel
          highContrast={highContrast}
          onClose={() => setNotificationsOpen(false)}
        />
      )}

      <div className="relative z-10 flex min-h-0 flex-1 overflow-hidden">
        <aside
          className={cx(
            "hidden w-60 shrink-0 flex-col border-r px-3 py-5 md:flex",
            highContrast ? "border-white/20" : "border-[#d9e4df] bg-white/60",
          )}
        >
          <p className="mb-3 px-3 text-[10px] font-extrabold uppercase tracking-[0.22em] opacity-40">
            Your world
          </p>
          <nav
            aria-label="Primary navigation"
            className="flex flex-col gap-1.5"
          >
            {NAV_ITEMS.map((item) => (
              <NavButton
                active={tab === item.id}
                highContrast={highContrast}
                item={item}
                key={item.id}
                onClick={() => selectTab(item.id)}
              />
            ))}
          </nav>

          <div
            className={cx(
              "mt-auto rounded-2xl border p-3",
              highContrast
                ? "border-white/25 bg-white/5"
                : "border-[#dbe8e2] bg-[#f7faf8]",
            )}
          >
            <div className="mb-1.5 flex items-center gap-2 text-xs font-extrabold">
              {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
              {isOnline ? "Connected" : "Offline mode"}
            </div>
            <button
              className="text-[11px] font-bold text-[#267862] underline decoration-dotted underline-offset-2"
              onClick={() => setIsOnline((online) => !online)}
              type="button"
            >
              Toggle demo status
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto pb-28 md:pb-8">
          {tab === "map" && (
            <MapScreen
              highContrast={highContrast}
              onSelectVenue={setSelectedVenue}
              onToast={fireToast}
              query={searchQuery}
            />
          )}
          {tab === "care" && (
            <CareScreen
              highContrast={highContrast}
              onBook={(item) => setBookingFlow({ type: "care", item })}
            />
          )}
          {tab === "transport" && (
            <TransportScreen
              highContrast={highContrast}
              onBook={(item) => setBookingFlow({ type: "transport", item })}
            />
          )}
          {tab === "jobs" && (
            <JobsScreen
              highContrast={highContrast}
              onApply={(item) => setBookingFlow({ type: "job", item })}
              onToast={fireToast}
            />
          )}
          {tab === "profile" && (
            <ProfileScreen highContrast={highContrast} onToast={fireToast} />
          )}

          {suggestion && (
            <SuggestionCard
              highContrast={highContrast}
              onDismiss={() => setSuggestion(null)}
              suggestion={suggestion}
            />
          )}
        </main>
      </div>

      <nav
        aria-label="Primary navigation"
        className={cx(
          "fixed inset-x-0 bottom-0 z-40 flex border-t px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden",
          highContrast
            ? "border-white/20 bg-black/95"
            : "border-[#d9e4df] bg-white/92",
        )}
      >
        {NAV_ITEMS.map((item) => (
          <button
            aria-current={tab === item.id ? "page" : undefined}
            className={cx(
              "relative flex min-h-16 flex-1 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-extrabold transition",
              tab === item.id
                ? highContrast
                  ? "text-[#84f1ca]"
                  : "text-[#126f59]"
                : "opacity-50",
            )}
            key={item.id}
            onClick={() => selectTab(item.id)}
            type="button"
          >
            {tab === item.id && (
              <span className="absolute top-0 h-1 w-8 rounded-b-full bg-[#e66e3f]" />
            )}
            <item.icon size={20} strokeWidth={tab === item.id ? 2.6 : 2} />
            {item.label}
          </button>
        ))}
      </nav>

      {selectedVenue && (
        <VenueModal
          highContrast={highContrast}
          onClose={() => setSelectedVenue(null)}
          onPlan={() => {
            setSelectedVenue(null);
            setTab("transport");
          }}
          onToast={fireToast}
          venue={selectedVenue}
        />
      )}

      {bookingFlow && (
        <BookingModal
          flow={bookingFlow}
          highContrast={highContrast}
          onClose={() => setBookingFlow(null)}
          onComplete={() => handleBookingComplete(bookingFlow.type)}
        />
      )}

      {showSettings && (
        <SettingsDrawer
          highContrast={highContrast}
          onClose={() => setShowSettings(false)}
          setHighContrast={setHighContrast}
          setTextSize={setTextSize}
          textSize={textSize}
        />
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

function LogoMark({ compact = false }: { compact?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "grid place-items-center rounded-2xl bg-[#173f36] font-heading font-extrabold text-white",
        compact ? "h-9 w-9 text-sm" : "h-10 w-10 text-base",
      )}
    >
      M
    </span>
  );
}

function IconButton({
  children,
  highContrast,
  label,
  onClick,
  pressed,
}: {
  children: React.ReactNode;
  highContrast: boolean;
  label: string;
  onClick: () => void;
  pressed?: boolean;
}) {
  return (
    <button
      aria-label={label}
      aria-pressed={pressed}
      className={cx(
        "relative grid h-11 w-11 place-items-center rounded-full transition",
        highContrast
          ? "text-white hover:bg-white/10"
          : "text-[#173f36] hover:bg-[#e7f0eb]",
        pressed && (highContrast ? "bg-white/15" : "bg-[#e7f0eb]"),
      )}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function NavButton({
  active,
  highContrast,
  item,
  onClick,
}: {
  active: boolean;
  highContrast: boolean;
  item: { id: Tab; label: string; icon: LucideIcon };
  onClick: () => void;
}) {
  return (
    <button
      aria-current={active ? "page" : undefined}
      className={cx(
        "flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-extrabold transition",
        active
          ? highContrast
            ? "bg-white/15 text-[#84f1ca]"
            : "bg-[#e7f5ef] text-[#126f59]"
          : "opacity-60 hover:opacity-100",
      )}
      onClick={onClick}
      type="button"
    >
      <item.icon size={18} strokeWidth={active ? 2.6 : 2} />
      {item.label}
    </button>
  );
}

function ScreenHeader({
  body,
  eyebrow,
  title,
}: {
  body: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <header className="mb-5">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#d66035]">
        {eyebrow}
      </p>
      <h1 className="mt-1 font-heading text-2xl font-extrabold tracking-[-0.03em]">
        {title}
      </h1>
      <p className="mt-1.5 max-w-2xl text-sm font-medium leading-relaxed opacity-55">
        {body}
      </p>
    </header>
  );
}

function NotificationsPanel({
  highContrast,
  onClose,
}: {
  highContrast: boolean;
  onClose: () => void;
}) {
  useEscape(onClose);
  const items = [
    {
      title: "Ride arriving soon",
      body: "Your accessible sedan is 6 minutes away.",
      time: "Now",
    },
    {
      title: "Care booking confirmed",
      body: "Amara T. is booked for Thursday at 10:00 am.",
      time: "2h",
    },
    {
      title: "New matching job",
      body: "Library Assistant at City of Parramatta is 87% match.",
      time: "Yesterday",
    },
  ];

  return (
    <div
      className={cx(
        "absolute inset-x-0 top-[4.5rem] z-40 mx-auto w-[calc(100%-1.5rem)] max-w-md overflow-hidden rounded-[24px] border shadow-2xl",
        highContrast
          ? "border-white/25 bg-black text-white"
          : "border-[#d6e2dc] bg-white text-[#173f36]",
      )}
      role="dialog"
      aria-label="Notifications"
    >
      <div className="flex items-center justify-between border-b border-current/10 px-4 py-3">
        <p className="text-sm font-extrabold">Notifications</p>
        <IconButton
          highContrast={highContrast}
          label="Close notifications"
          onClick={onClose}
        >
          <X size={16} />
        </IconButton>
      </div>
      <ul className="divide-y divide-current/10">
        {items.map((item) => (
          <li className="px-4 py-3" key={item.title}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-extrabold">{item.title}</p>
                <p className="mt-0.5 text-xs font-medium opacity-55">
                  {item.body}
                </p>
              </div>
              <span className="shrink-0 text-[10px] font-bold opacity-40">
                {item.time}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MapScreen({
  highContrast,
  onSelectVenue,
  onToast,
  query,
}: {
  highContrast: boolean;
  onSelectVenue: (venue: Venue) => void;
  onToast: (message: string) => void;
  query: string;
}) {
  const venues = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return VENUES;
    return VENUES.filter(
      (venue) =>
        venue.name.toLowerCase().includes(q) ||
        venue.category.toLowerCase().includes(q) ||
        venue.tags.some((tag) => tag.toLowerCase().includes(q)),
    );
  }, [query]);

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
      <ScreenHeader
        body="Find accessible places near you — cafes, parks, libraries, and health centres."
        eyebrow="Explore"
        title="Accessible places nearby"
      />
      <div
        className={cx(
          "relative mb-5 overflow-hidden rounded-[28px] border",
          highContrast
            ? "border-white/25 bg-white/5"
            : "border-[#d6e2dc] bg-white",
        )}
      >
        <div
          aria-hidden="true"
          className={cx(
            "relative h-56 w-full sm:h-72",
            highContrast
              ? "bg-[radial-gradient(circle_at_30%_40%,rgba(132,241,202,0.25),transparent_45%),linear-gradient(135deg,#0b1f1a,#12332b)]"
              : "bg-[radial-gradient(circle_at_30%_40%,rgba(39,125,104,0.18),transparent_45%),linear-gradient(135deg,#e8f4ef,#f7faf8)]",
          )}
        >
          {venues.map((venue) => (
            <button
              aria-label={`${venue.name}, ${venue.access} access`}
              className="absolute grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white bg-[#173f36] text-white shadow-md transition hover:scale-110"
              key={venue.id}
              onClick={() => onSelectVenue(venue)}
              style={{
                left: `${venue.position[0]}%`,
                top: `${venue.position[1]}%`,
              }}
              type="button"
            >
              <venue.icon size={16} />
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-current/10 px-4 py-3">
          <p className="flex items-center gap-2 text-xs font-bold opacity-60">
            <MapPin size={14} /> {venues.length} places match your search
          </p>
          <button
            className="flex min-h-9 items-center gap-1.5 rounded-full border border-current/20 px-3 text-xs font-extrabold"
            onClick={() => onToast("Filters opened")}
            type="button"
          >
            <Filter size={13} /> Filters
          </button>
        </div>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {venues.map((venue) => (
          <li key={venue.id}>
            <button
              className={cx(
                "flex w-full items-start gap-3 rounded-[24px] border p-4 text-left transition hover:-translate-y-0.5",
                highContrast
                  ? "border-white/25 bg-white/5"
                  : "border-[#d6e2dc] bg-white shadow-[0_8px_24px_rgba(32,75,62,0.05)]",
              )}
              onClick={() => onSelectVenue(venue)}
              type="button"
            >
              <span
                className={cx(
                  "grid h-11 w-11 shrink-0 place-items-center rounded-2xl",
                  highContrast
                    ? "bg-white/15"
                    : "bg-[#e5f3ec] text-[#17634f]",
                )}
              >
                <venue.icon size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-heading text-sm font-extrabold">
                      {venue.name}
                    </h2>
                    <p className="mt-0.5 text-xs font-semibold opacity-45">
                      {venue.category} · {venue.distance}
                    </p>
                  </div>
                  <Badge
                    highContrast={highContrast}
                    tone={venue.access === "Full" ? "green" : "amber"}
                  >
                    {venue.access}
                  </Badge>
                </div>
                <div className="mt-2">
                  <StarRating rating={venue.rating} reviews={venue.reviews} />
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CareScreen({
  highContrast,
  onBook,
}: {
  highContrast: boolean;
  onBook: (item: CareProvider) => void;
}) {
  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      <ScreenHeader
        body="Browse verified support workers matched to your access preferences."
        eyebrow="Care"
        title="Support near you"
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <Badge highContrast={highContrast} tone="green">
          NDIS registered
        </Badge>
        <Badge highContrast={highContrast} tone="blue">
          <Clock3 className="mr-1 inline" size={11} /> Available this week
        </Badge>
      </div>
      <ul className="space-y-3">
        {CARE_PROVIDERS.map((provider) => (
          <li
            className={cx(
              "rounded-[24px] border p-4",
              highContrast
                ? "border-white/25 bg-white/5"
                : "border-[#d6e2dc] bg-white shadow-[0_8px_24px_rgba(32,75,62,0.05)]",
            )}
            key={provider.id}
          >
            <div className="flex items-start gap-3">
              <span
                className={cx(
                  "grid h-12 w-12 shrink-0 place-items-center rounded-2xl font-heading text-sm font-extrabold text-white",
                  provider.colour,
                )}
              >
                {provider.initials}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="font-heading text-sm font-extrabold">
                      {provider.name}
                    </h2>
                    <p className="mt-0.5 text-xs font-semibold opacity-45">
                      {provider.role}
                    </p>
                  </div>
                  <p className="text-sm font-extrabold">{provider.rate}</p>
                </div>
                <div className="mt-2">
                  <StarRating
                    rating={provider.rating}
                    reviews={provider.reviews}
                  />
                </div>
                <div className="my-3 flex flex-wrap gap-1.5">
                  {provider.tags.map((tag) => (
                    <Badge highContrast={highContrast} key={tag}>
                      {tag}
                    </Badge>
                  ))}
                </div>
                <PrimaryButton onClick={() => onBook(provider)}>
                  Book support
                </PrimaryButton>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TransportScreen({
  highContrast,
  onBook,
}: {
  highContrast: boolean;
  onBook: (item: TransportOption) => void;
}) {
  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      <ScreenHeader
        body="Choose an accessible ride that matches your mobility needs."
        eyebrow="Transport"
        title="Accessible rides"
      />
      <div
        className={cx(
          "mb-4 flex items-center gap-3 rounded-[24px] border p-4",
          highContrast
            ? "border-white/25 bg-white/5"
            : "border-[#d6e2dc] bg-white",
        )}
      >
        <Navigation className="text-[#d66035]" size={20} />
        <div>
          <p className="text-sm font-extrabold">
            Current location → Destination
          </p>
          <p className="text-xs font-semibold opacity-45">
            Share access needs before confirming a ride
          </p>
        </div>
      </div>
      <ul className="space-y-3">
        {TRANSPORT_OPTIONS.map((option) => (
          <li
            className={cx(
              "rounded-[24px] border p-4",
              highContrast
                ? "border-white/25 bg-white/5"
                : "border-[#d6e2dc] bg-white shadow-[0_8px_24px_rgba(32,75,62,0.05)]",
            )}
            key={option.id}
          >
            <div className="flex items-start gap-3">
              <span
                className={cx(
                  "grid h-11 w-11 shrink-0 place-items-center rounded-2xl",
                  highContrast
                    ? "bg-white/15"
                    : "bg-[#e5f3ec] text-[#17634f]",
                )}
              >
                <option.icon size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="font-heading text-sm font-extrabold">
                      {option.type}
                    </h2>
                    <p className="mt-0.5 text-xs font-semibold opacity-45">
                      {option.capacity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold">{option.price}</p>
                    <p className="text-xs font-bold text-[#267862]">
                      {option.eta}
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <PrimaryButton onClick={() => onBook(option)}>
                    Book this ride
                  </PrimaryButton>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function JobsScreen({
  highContrast,
  onApply,
  onToast,
}: {
  highContrast: boolean;
  onApply: (item: Job) => void;
  onToast: (message: string) => void;
}) {
  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      <ScreenHeader
        body="Roles that respect accessibility needs and flexible working."
        eyebrow="Work"
        title="Jobs matched to you"
      />
      <div className="mb-4 flex items-center gap-2 text-xs font-bold opacity-55">
        <Plus size={14} /> {JOBS.length} roles ready to explore
      </div>
      <div className="space-y-3">
        {JOBS.map((job) => (
          <div
            className={cx(
              "rounded-[24px] border p-4",
              highContrast
                ? "border-white/25 bg-white/5"
                : "border-[#d6e2dc] bg-white shadow-[0_8px_24px_rgba(32,75,62,0.05)]",
            )}
            key={job.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-heading text-sm font-extrabold">
                  {job.title}
                </h3>
                <p className="mt-0.5 text-xs font-semibold opacity-45">
                  {job.company}
                </p>
              </div>
              <Badge highContrast={highContrast} tone="coral">
                {job.match}% match
              </Badge>
            </div>
            <div className="my-3 flex flex-wrap gap-1.5">
              {job.tags.map((tag) => (
                <Badge highContrast={highContrast} key={tag}>
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <PrimaryButton className="flex-1" onClick={() => onApply(job)}>
                Apply now
              </PrimaryButton>
              <button
                className={cx(
                  "min-h-10 rounded-full border px-4 text-xs font-extrabold",
                  highContrast ? "border-white/35" : "border-[#cddbd4]",
                )}
                onClick={() => onToast(`${job.title} details opened`)}
                type="button"
              >
                Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileScreen({

  highContrast,
  onToast,
}: {
  highContrast: boolean;
  onToast: (message: string) => void;
}) {
  const actions = [
    { icon: Accessibility, label: "Accessibility preferences" },
    { icon: UsersRound, label: "My support team" },
    { icon: Phone, label: "Emergency contacts" },
    { icon: MessageCircle, label: "Help and support" },
  ];

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      <ScreenHeader
        body="Your preferences travel with you across MapAble services."
        eyebrow="Your MapAble"
        title="Jordan Mitchell"
      />
      <div
        className={cx(
          "mb-4 flex items-center gap-4 rounded-[28px] border p-5",
          highContrast
            ? "border-white/25 bg-white/5"
            : "border-[#d6e2dc] bg-white",
        )}
      >
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[22px] bg-[#173f36] font-heading text-xl font-extrabold text-white">
          JM
        </span>
        <div>
          <h2 className="font-heading text-lg font-extrabold">
            Jordan Mitchell
          </h2>
          <p className="text-xs font-semibold opacity-45">
            NDIS participant Â· Plan managed
          </p>
          <div className="mt-2">
            <Badge highContrast={highContrast} tone="green">
              Profile verified
            </Badge>
          </div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        {[
          { icon: CalendarDays, label: "Upcoming bookings", value: "3" },
          { icon: ShieldCheck, label: "Verified provider", value: "Yes" },
        ].map((stat) => (
          <div
            className={cx(
              "rounded-[24px] border p-4",
              highContrast
                ? "border-white/25 bg-white/5"
                : "border-[#d6e2dc] bg-white",
            )}
            key={stat.label}
          >
            <stat.icon className="mb-3 text-[#d66035]" size={20} />
            <p className="font-heading text-xl font-extrabold">{stat.value}</p>
            <p className="text-xs font-semibold opacity-45">{stat.label}</p>
          </div>
        ))}
      </div>

      <div
        className={cx(
          "divide-y overflow-hidden rounded-[24px] border",
          highContrast
            ? "divide-white/15 border-white/25 bg-white/5"
            : "divide-[#e1eae5] border-[#d6e2dc] bg-white",
        )}
      >
        {actions.map((item) => (
          <button
            className="flex min-h-14 w-full items-center gap-3 px-4 text-left text-sm font-bold transition hover:bg-current/5"
            key={item.label}
            onClick={() => onToast(`${item.label} opened`)}
            type="button"
          >
            <item.icon className="opacity-45" size={18} />
            <span className="flex-1">{item.label}</span>
            <ChevronRight className="opacity-25" size={17} />
          </button>
        ))}
      </div>
    </div>
  );
}

function SuggestionCard({
  highContrast,
  onDismiss,
  suggestion,
}: {
  highContrast: boolean;
  onDismiss: () => void;
  suggestion: Suggestion;
}) {
  return (
    <div className="mx-auto mt-2 max-w-5xl px-4 sm:px-6 lg:px-8">
      <div
        className={cx(
          "flex items-start gap-3 rounded-[24px] border p-4",
          highContrast
            ? "border-white/30 bg-white/10"
            : "border-[#b7dfd0] bg-[#e7f5ef]",
        )}
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#173f36] text-white">
          <Sparkles size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold">{suggestion.title}</p>
          <p className="mt-0.5 text-xs font-medium leading-relaxed opacity-55">
            {suggestion.body}
          </p>
          <button
            className="mt-2 flex items-center gap-1.5 text-xs font-extrabold text-[#17634f]"
            onClick={suggestion.action}
            type="button"
          >
            {suggestion.cta} <ArrowRight size={14} />
          </button>
        </div>
        <IconButton
          highContrast={highContrast}
          label="Dismiss suggestion"
          onClick={onDismiss}
        >
          <X size={16} />
        </IconButton>
      </div>
    </div>
  );
}

function PrimaryButton({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick: () => void;
}) {
  return (
    <button
      className={cx(
        "min-h-10 rounded-full bg-[#e66e3f] px-4 text-xs font-extrabold text-white transition hover:bg-[#c6532b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e66e3f]",
        className,
      )}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function ModalShell({
  children,
  highContrast,
  label,
  onClose,
  width = "max-w-md",
}: {
  children: React.ReactNode;
  highContrast: boolean;
  label: string;
  onClose: () => void;
  width?: string;
}) {
  useEscape(onClose);
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[#071a15]/65 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <button
        aria-label={`Close ${label}`}
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        type="button"
      />
      <div
        aria-label={label}
        aria-modal="true"
        className={cx(
          "relative max-h-[92vh] w-full overflow-y-auto rounded-t-[30px] p-5 shadow-2xl sm:rounded-[30px]",
          width,
          highContrast
            ? "border border-white/30 bg-black text-white"
            : "bg-white text-[#173f36]",
        )}
        role="dialog"
      >
        {children}
      </div>
    </div>
  );
}

function VenueModal({
  highContrast,
  onClose,
  onPlan,
  onToast,
  venue,
}: {
  highContrast: boolean;
  onClose: () => void;
  onPlan: () => void;
  onToast: (message: string) => void;
  venue: Venue;
}) {
  return (
    <ModalShell
      highContrast={highContrast}
      label={`${venue.name} details`}
      onClose={onClose}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={cx(
              "grid h-12 w-12 place-items-center rounded-2xl",
              highContrast ? "bg-white/15" : "bg-[#e5f3ec] text-[#17634f]",
            )}
          >
            <venue.icon size={21} />
          </span>
          <div>
            <h2 className="font-heading text-lg font-extrabold leading-tight">
              {venue.name}
            </h2>
            <p className="mt-0.5 text-xs font-semibold opacity-45">
              {venue.category} Â· {venue.distance} away
            </p>
          </div>
        </div>
        <IconButton
          highContrast={highContrast}
          label="Close venue details"
          onClick={onClose}
        >
          <X size={18} />
        </IconButton>
      </div>
      <StarRating rating={venue.rating} reviews={venue.reviews} />
      <div className="my-4 flex flex-wrap gap-1.5">
        {venue.tags.map((tag) => (
          <Badge highContrast={highContrast} key={tag} tone="green">
            {tag}
          </Badge>
        ))}
      </div>
      <div
        className={cx(
          "mb-5 rounded-2xl p-4 text-xs font-medium leading-relaxed",
          highContrast ? "bg-white/10" : "bg-[#f2f7f4]",
        )}
      >
        <p className="mb-1 font-extrabold">Community verified Â· 2 weeks ago</p>
        Step-free entrance via the main door, accessible toilet with grab rails,
        and staff trained in disability awareness.
      </div>
      <div className="flex gap-2">
        <button
          className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#173f36] px-4 text-sm font-extrabold text-white transition hover:bg-[#245e50]"
          onClick={onPlan}
          type="button"
        >
          <CarFront size={17} /> Plan accessible ride
        </button>
        <button
          aria-label={`Save ${venue.name}`}
          className={cx(
            "grid min-h-12 min-w-12 place-items-center rounded-2xl border",
            highContrast ? "border-white/35" : "border-[#cddbd4]",
          )}
          onClick={() => onToast(`${venue.name} saved to favourites`)}
          type="button"
        >
          <Heart size={18} />
        </button>
      </div>
    </ModalShell>
  );
}

function BookingModal({
  flow,
  highContrast,
  onClose,
  onComplete,
}: {
  flow: { type: FlowType; item: BookingItem };
  highContrast: boolean;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [step, setStep] = useState(1);
  const title = {
    care: "Book support worker",
    transport: "Confirm your ride",
    job: "Apply for this role",
  }[flow.type];
  const itemTitle =
    "name" in flow.item
      ? flow.item.name
      : "type" in flow.item
        ? flow.item.type
        : flow.item.title;
  const itemDetail =
    "role" in flow.item
      ? flow.item.role
      : "capacity" in flow.item
        ? flow.item.capacity
        : flow.item.company;

  return (
    <ModalShell
      highContrast={highContrast}
      label={title}
      onClose={onClose}
      width="max-w-sm"
    >
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#d66035]">
            Step {step} of 2
          </p>
          <h2 className="font-heading text-lg font-extrabold">{title}</h2>
        </div>
        <IconButton
          highContrast={highContrast}
          label="Close booking"
          onClick={onClose}
        >
          <X size={18} />
        </IconButton>
      </div>
      <div className="mb-5 flex gap-2" aria-hidden="true">
        <span className="h-1.5 flex-1 rounded-full bg-[#e66e3f]" />
        <span
          className={cx(
            "h-1.5 flex-1 rounded-full",
            step === 2
              ? "bg-[#e66e3f]"
              : highContrast
                ? "bg-white/20"
                : "bg-[#dce7e1]",
          )}
        />
      </div>

      {step === 1 ? (
        <>
          <div
            className={cx(
              "mb-4 rounded-2xl p-3.5",
              highContrast ? "bg-white/10" : "bg-[#f2f7f4]",
            )}
          >
            <p className="text-sm font-extrabold">{itemTitle}</p>
            <p className="mt-0.5 text-xs font-semibold opacity-45">
              {itemDetail}
            </p>
          </div>
          {flow.type !== "job" && (
            <div className="mb-5 space-y-3">
              <div className="block">
                <span className="text-xs font-extrabold opacity-60">
                  Date and time
                </span>
                <span
                  className={cx(
                    "mt-1.5 flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-sm font-bold",
                    highContrast ? "border-white/30" : "border-[#d2dfd9]",
                  )}
                >
                  <CalendarDays size={16} /> Thursday, 10:00 am
                </span>
              </div>
              <label className="block">
                <span className="text-xs font-extrabold opacity-60">
                  Notes for the provider
                </span>
                <textarea
                  className={cx(
                    "mt-1.5 w-full rounded-2xl border bg-transparent px-3 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-[#2b8c73]",
                    highContrast ? "border-white/30" : "border-[#d2dfd9]",
                  )}
                  placeholder="For example: ground floor entry preferred"
                  rows={2}
                />
              </label>
            </div>
          )}
          <button
            className="min-h-12 w-full rounded-2xl bg-[#e66e3f] text-sm font-extrabold text-white transition hover:bg-[#c6532b]"
            onClick={() => setStep(2)}
            type="button"
          >
            Continue
          </button>
        </>
      ) : (
        <>
          <div className="flex flex-col items-center px-3 py-5 text-center">
            <span className="mb-4 grid h-16 w-16 place-items-center rounded-[22px] bg-[#dff5e9] text-[#126246]">
              <Check size={29} strokeWidth={2.7} />
            </span>
            <p className="font-heading text-lg font-extrabold">
              Ready to confirm
            </p>
            <p className="mt-2 max-w-xs text-xs font-medium leading-relaxed opacity-55">
              {flow.type === "care" &&
                "This booking will be charged to your NDIS Core Supports budget."}
              {flow.type === "transport" &&
                "Your accessible vehicle will be dispatched immediately after confirmation."}
              {flow.type === "job" &&
                "Your MapAble profile and accommodation preferences will be shared with the employer."}
            </p>
          </div>
          <button
            className="min-h-12 w-full rounded-2xl bg-[#173f36] text-sm font-extrabold text-white transition hover:bg-[#245e50]"
            onClick={onComplete}
            type="button"
          >
            Confirm
          </button>
        </>
      )}
    </ModalShell>
  );
}

function SettingsDrawer({
  highContrast,
  onClose,
  setHighContrast,
  setTextSize,
  textSize,
}: {
  highContrast: boolean;
  onClose: () => void;
  setHighContrast: (active: boolean) => void;
  setTextSize: (size: TextSize) => void;
  textSize: TextSize;
}) {
  useEscape(onClose);
  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-[#071a15]/65 backdrop-blur-sm">
      <button
        aria-label="Close accessibility settings"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        type="button"
      />
      <div
        aria-label="Accessibility settings"
        aria-modal="true"
        className={cx(
          "relative h-full w-full max-w-sm overflow-y-auto p-5 shadow-2xl",
          highContrast
            ? "border-l border-white/30 bg-black text-white"
            : "bg-white text-[#173f36]",
        )}
        role="dialog"
      >
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#d66035]">
              Make it yours
            </p>
            <h2 className="font-heading text-xl font-extrabold">
              Accessibility
            </h2>
          </div>
          <IconButton
            highContrast={highContrast}
            label="Close settings"
            onClick={onClose}
          >
            <X size={18} />
          </IconButton>
        </div>

        <div className="mb-7">
          <div className="mb-3 flex items-center gap-2">
            <Contrast size={17} />
            <span className="text-sm font-extrabold">High contrast mode</span>
          </div>
          <button
            aria-checked={highContrast}
            className={cx(
              "flex h-8 w-14 items-center rounded-full p-1 transition",
              highContrast
                ? "justify-end bg-[#68d8af]"
                : "justify-start bg-[#c9d5cf]",
            )}
            onClick={() => setHighContrast(!highContrast)}
            role="switch"
            type="button"
          >
            <span className="h-6 w-6 rounded-full bg-white shadow-md" />
          </button>
        </div>

        <div className="mb-7">
          <div className="mb-3 flex items-center gap-2">
            <Type size={17} />
            <span className="text-sm font-extrabold">Text size</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(["normal", "large", "xlarge"] as TextSize[]).map((size) => (
              <button
                aria-pressed={textSize === size}
                className={cx(
                  "min-h-11 rounded-xl border text-xs font-extrabold capitalize transition",
                  textSize === size
                    ? highContrast
                      ? "border-white bg-white text-black"
                      : "border-[#173f36] bg-[#173f36] text-white"
                    : highContrast
                      ? "border-white/30"
                      : "border-[#d2dfd9]",
                )}
                key={size}
                onClick={() => setTextSize(size)}
                type="button"
              >
                {size === "xlarge" ? "X-large" : size}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-7">
          <div className="mb-2 flex items-center gap-2">
            <Volume2 size={17} />
            <span className="text-sm font-extrabold">
              Screen reader support
            </span>
          </div>
          <p className="text-xs font-medium leading-relaxed opacity-55">
            Navigation, dialogs and status updates include accessible labels and
            keyboard support.
          </p>
        </div>

        <div
          className={cx(
            "flex items-start gap-2.5 rounded-2xl p-3.5 text-xs font-medium leading-relaxed",
            highContrast ? "bg-white/10" : "bg-[#e7f5ef] text-[#17634f]",
          )}
        >
          <Eye className="mt-0.5 shrink-0" size={15} />
          These preferences can sync across your devices when you sign in.
        </div>
      </div>
    </div>
  );
}

