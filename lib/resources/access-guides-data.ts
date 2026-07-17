export type AccessGuideStatusKey =
  | "drafted"
  | "needs_verification"
  | "planned"
  | "partner_supplied"
  | "community_reported";

export type AccessGuide = {
  id: string;
  state: string;
  stateSlug: string;
  city: string;
  citySlug: string;
  /** Alias for UI: city or town name */
  cityOrTown: string;
  /** Alias for UI: `${city} Accessibility Guide` */
  title: string;
  guideType: string;
  href: string;
  priorityTier: string;
  /** Alias for priorityTier used by map filters */
  tier: string;
  launchAngle: string;
  /** Alias for launchAngle */
  summary: string;
  mappingMissions: string[];
  keyAccessThemes: string[];
  status: string;
  statusKey: AccessGuideStatusKey;
  latitude: number;
  longitude: number;
};

export const accessGuideDownloads = {
  pdf: "/resources/access-guides/MapAble_Accessibility_Guides_Australia.pdf",
  docx: "/resources/access-guides/MapAble_Accessibility_Guides_Australia.docx",
  rolloutMatrix:
    "/resources/access-guides/MapAble_Accessibility_Guide_Rollout_Matrix.csv",
} as const;

export const accessGuides: AccessGuide[] = [
  {
    "id": "guide-act-canberra",
    "state": "ACT",
    "stateSlug": "act",
    "city": "Canberra",
    "citySlug": "canberra-accessibility-guide",
    "cityOrTown": "Canberra",
    "title": "Canberra Accessibility Guide",
    "latitude": -35.2809,
    "longitude": 149.13,
    "guideType": "Capital",
    "href": "/guides/act/canberra-accessibility-guide",
    "priorityTier": "Capital launch",
    "tier": "Capital launch",
    "launchAngle": "A compact capital where accessible outings often depend on linking bus, light rail, museums, civic precincts and lakeside paths into one predictable day.",
    "summary": "A compact capital where accessible outings often depend on linking bus, light rail, museums, civic precincts and lakeside paths into one predictable day.",
    "mappingMissions": [
      "Map the National Triangle accessible entrances and toilets.",
      "Verify light rail to museum and civic precinct routes.",
      "Create a sensory-friendly Canberra half-day itinerary."
    ],
    "keyAccessThemes": [
      "Map the National Triangle accessible entrances and toilets.",
      "Verify light rail to museum and civic precinct routes.",
      "Create a sensory-friendly Canberra half-day itinerary."
    ],
    "status": "Capital starter guide drafted",
    "statusKey": "drafted"
  },
  {
    "id": "guide-nsw-sydney",
    "state": "NSW",
    "stateSlug": "nsw",
    "city": "Sydney",
    "citySlug": "sydney-accessibility-guide",
    "cityOrTown": "Sydney",
    "title": "Sydney Accessibility Guide",
    "latitude": -33.8688,
    "longitude": 151.2093,
    "guideType": "Capital",
    "href": "/guides/nsw/sydney-accessibility-guide",
    "priorityTier": "Capital launch",
    "tier": "Capital launch",
    "launchAngle": "Australia\u2019s largest visitor city needs a guide that separates broad accessibility claims from the real details: lifts, gradients, wharves, station exits, toilets, crowds and event-day detours.",
    "summary": "Australia\u2019s largest visitor city needs a guide that separates broad accessibility claims from the real details: lifts, gradients, wharves, station exits, toilets, crowds and event-day detours.",
    "mappingMissions": [
      "Audit Circular Quay to Opera House and Royal Botanic Garden paths.",
      "Map step-free routes around Central, Town Hall and Barangaroo.",
      "Create a beach-access mini-guide covering mats, beach wheelchairs and nearby toilets."
    ],
    "keyAccessThemes": [
      "Audit Circular Quay to Opera House and Royal Botanic Garden paths.",
      "Map step-free routes around Central, Town Hall and Barangaroo.",
      "Create a beach-access mini-guide covering mats, beach wheelchairs and nearby toilets."
    ],
    "status": "Capital starter guide drafted",
    "statusKey": "drafted"
  },
  {
    "id": "guide-vic-melbourne",
    "state": "VIC",
    "stateSlug": "vic",
    "city": "Melbourne",
    "citySlug": "melbourne-accessibility-guide",
    "cityOrTown": "Melbourne",
    "title": "Melbourne Accessibility Guide",
    "latitude": -37.8136,
    "longitude": 144.9631,
    "guideType": "Capital",
    "href": "/guides/vic/melbourne-accessibility-guide",
    "priorityTier": "Capital launch",
    "tier": "Capital launch",
    "launchAngle": "Melbourne needs an access guide that explains the practical difference between trains, buses, trams, level-access stops, laneways, event crowds and CBD mobility maps.",
    "summary": "Melbourne needs an access guide that explains the practical difference between trains, buses, trams, level-access stops, laneways, event crowds and CBD mobility maps.",
    "mappingMissions": [
      "Build a CBD mobility loop from Southern Cross to Federation Square.",
      "Verify accessible laneway dining routes.",
      "Map quiet exits and low-crowd alternatives around major venues."
    ],
    "keyAccessThemes": [
      "Build a CBD mobility loop from Southern Cross to Federation Square.",
      "Verify accessible laneway dining routes.",
      "Map quiet exits and low-crowd alternatives around major venues."
    ],
    "status": "Capital starter guide drafted",
    "statusKey": "drafted"
  },
  {
    "id": "guide-qld-brisbane",
    "state": "QLD",
    "stateSlug": "qld",
    "city": "Brisbane",
    "citySlug": "brisbane-accessibility-guide",
    "cityOrTown": "Brisbane",
    "title": "Brisbane Accessibility Guide",
    "latitude": -27.4698,
    "longitude": 153.0251,
    "guideType": "Capital",
    "href": "/guides/qld/brisbane-accessibility-guide",
    "priorityTier": "Capital launch",
    "tier": "Capital launch",
    "launchAngle": "A river city guide should connect trains, buses, CityCat-style river travel, bridges, South Bank, hospitals and event venues with heat-aware access planning.",
    "summary": "A river city guide should connect trains, buses, CityCat-style river travel, bridges, South Bank, hospitals and event venues with heat-aware access planning.",
    "mappingMissions": [
      "Create a South Bank accessible day route.",
      "Map Roma Street and CBD interchange access details.",
      "Verify riverfront access with heat, shade and seating notes."
    ],
    "keyAccessThemes": [
      "Create a South Bank accessible day route.",
      "Map Roma Street and CBD interchange access details.",
      "Verify riverfront access with heat, shade and seating notes."
    ],
    "status": "Capital starter guide drafted",
    "statusKey": "drafted"
  },
  {
    "id": "guide-sa-adelaide",
    "state": "SA",
    "stateSlug": "sa",
    "city": "Adelaide",
    "citySlug": "adelaide-accessibility-guide",
    "cityOrTown": "Adelaide",
    "title": "Adelaide Accessibility Guide",
    "latitude": -34.9285,
    "longitude": 138.6007,
    "guideType": "Capital",
    "href": "/guides/sa/adelaide-accessibility-guide",
    "priorityTier": "Capital launch",
    "tier": "Capital launch",
    "launchAngle": "Adelaide\u2019s grid, parklands and festival calendar make it a strong guide for cultural access, quiet routes, tram/train/bus links and regional visitor planning.",
    "summary": "Adelaide\u2019s grid, parklands and festival calendar make it a strong guide for cultural access, quiet routes, tram/train/bus links and regional visitor planning.",
    "mappingMissions": [
      "Map an Adelaide Festival access route.",
      "Verify Rundle Mall and North Terrace accessible entries.",
      "Create a quiet Adelaide city rest-stop list."
    ],
    "keyAccessThemes": [
      "Map an Adelaide Festival access route.",
      "Verify Rundle Mall and North Terrace accessible entries.",
      "Create a quiet Adelaide city rest-stop list."
    ],
    "status": "Capital starter guide drafted",
    "statusKey": "drafted"
  },
  {
    "id": "guide-wa-perth",
    "state": "WA",
    "stateSlug": "wa",
    "city": "Perth",
    "citySlug": "perth-accessibility-guide",
    "cityOrTown": "Perth",
    "title": "Perth Accessibility Guide",
    "latitude": -31.9505,
    "longitude": 115.8605,
    "guideType": "Capital",
    "href": "/guides/wa/perth-accessibility-guide",
    "priorityTier": "Capital launch",
    "tier": "Capital launch",
    "launchAngle": "Perth requires a guide that links long-distance city travel, rail stations, riverfront areas, beaches, hospitals and accessible parking into realistic itineraries.",
    "summary": "Perth requires a guide that links long-distance city travel, rail stations, riverfront areas, beaches, hospitals and accessible parking into realistic itineraries.",
    "mappingMissions": [
      "Create a Perth CBD to Elizabeth Quay access loop.",
      "Verify Optus Stadium and event-day transport access.",
      "Map accessible beach infrastructure across metro beaches."
    ],
    "keyAccessThemes": [
      "Create a Perth CBD to Elizabeth Quay access loop.",
      "Verify Optus Stadium and event-day transport access.",
      "Map accessible beach infrastructure across metro beaches."
    ],
    "status": "Capital starter guide drafted",
    "statusKey": "drafted"
  },
  {
    "id": "guide-tas-hobart",
    "state": "TAS",
    "stateSlug": "tas",
    "city": "Hobart",
    "citySlug": "hobart-accessibility-guide",
    "cityOrTown": "Hobart",
    "title": "Hobart Accessibility Guide",
    "latitude": -42.8821,
    "longitude": 147.3272,
    "guideType": "Capital",
    "href": "/guides/tas/hobart-accessibility-guide",
    "priorityTier": "Capital launch",
    "tier": "Capital launch",
    "launchAngle": "Hobart\u2019s hills, heritage buildings, waterfront and compact visitor core make it a guide where gradients and entrance details matter as much as destination lists.",
    "summary": "Hobart\u2019s hills, heritage buildings, waterfront and compact visitor core make it a guide where gradients and entrance details matter as much as destination lists.",
    "mappingMissions": [
      "Map Hobart waterfront to Salamanca step-free options.",
      "Create a hills and gradients warning layer for the CBD.",
      "Verify museum, market and ferry-adjacent access details."
    ],
    "keyAccessThemes": [
      "Map Hobart waterfront to Salamanca step-free options.",
      "Create a hills and gradients warning layer for the CBD.",
      "Verify museum, market and ferry-adjacent access details."
    ],
    "status": "Capital starter guide drafted",
    "statusKey": "drafted"
  },
  {
    "id": "guide-nt-darwin",
    "state": "NT",
    "stateSlug": "nt",
    "city": "Darwin",
    "citySlug": "darwin-accessibility-guide",
    "cityOrTown": "Darwin",
    "title": "Darwin Accessibility Guide",
    "latitude": -12.4634,
    "longitude": 130.8456,
    "guideType": "Capital",
    "href": "/guides/nt/darwin-accessibility-guide",
    "priorityTier": "Capital launch",
    "tier": "Capital launch",
    "launchAngle": "Darwin needs a heat-aware, wet-season-aware guide that connects buses, accessible taxis, waterfront spaces, cultural venues, parks and regional gateways.",
    "summary": "Darwin needs a heat-aware, wet-season-aware guide that connects buses, accessible taxis, waterfront spaces, cultural venues, parks and regional gateways.",
    "mappingMissions": [
      "Create a Darwin Waterfront access and shade route.",
      "Verify CBD to waterfront path surfaces and rest points.",
      "Build a Top End visitor access checklist for heat, toilets and transport."
    ],
    "keyAccessThemes": [
      "Create a Darwin Waterfront access and shade route.",
      "Verify CBD to waterfront path surfaces and rest points.",
      "Build a Top End visitor access checklist for heat, toilets and transport."
    ],
    "status": "Capital starter guide drafted",
    "statusKey": "drafted"
  },
  {
    "id": "guide-nsw-newcastle",
    "state": "NSW",
    "stateSlug": "nsw",
    "city": "Newcastle",
    "citySlug": "newcastle-accessibility-guide",
    "cityOrTown": "Newcastle",
    "title": "Newcastle Accessibility Guide",
    "latitude": -32.9283,
    "longitude": 151.7817,
    "guideType": "Regional city",
    "href": "/guides/nsw/newcastle-accessibility-guide",
    "priorityTier": "Tier 1",
    "tier": "Tier 1",
    "launchAngle": "Beach, light rail, hospitals and waterfront access",
    "summary": "Beach, light rail, hospitals and waterfront access",
    "mappingMissions": [
      "Verify beach mats/wheelchairs, light rail stops, waterfront toilets"
    ],
    "keyAccessThemes": [
      "Verify beach mats/wheelchairs, light rail stops, waterfront toilets"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-nsw-wollongong",
    "state": "NSW",
    "stateSlug": "nsw",
    "city": "Wollongong",
    "citySlug": "wollongong-accessibility-guide",
    "cityOrTown": "Wollongong",
    "title": "Wollongong Accessibility Guide",
    "latitude": -34.4278,
    "longitude": 150.8931,
    "guideType": "Regional city",
    "href": "/guides/nsw/wollongong-accessibility-guide",
    "priorityTier": "Tier 1",
    "tier": "Tier 1",
    "launchAngle": "Coastal paths, university, hospital and beach access",
    "summary": "Coastal paths, university, hospital and beach access",
    "mappingMissions": [
      "Map coastal path gradients, accessible beaches, station-to-hospital routes"
    ],
    "keyAccessThemes": [
      "Map coastal path gradients, accessible beaches, station-to-hospital routes"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-nsw-central-coast",
    "state": "NSW",
    "stateSlug": "nsw",
    "city": "Central Coast / Gosford",
    "citySlug": "central-coast-accessibility-guide",
    "cityOrTown": "Central Coast / Gosford",
    "title": "Central Coast / Gosford Accessibility Guide",
    "latitude": -33.4267,
    "longitude": 151.342,
    "guideType": "Regional area",
    "href": "/guides/nsw/central-coast-accessibility-guide",
    "priorityTier": "Tier 1",
    "tier": "Tier 1",
    "launchAngle": "Train-linked day trips, beaches and health precincts",
    "summary": "Train-linked day trips, beaches and health precincts",
    "mappingMissions": [
      "Verify station access, accessible beaches, parking and toilets"
    ],
    "keyAccessThemes": [
      "Verify station access, accessible beaches, parking and toilets"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-nsw-coffs-harbour",
    "state": "NSW",
    "stateSlug": "nsw",
    "city": "Coffs Harbour",
    "citySlug": "coffs-harbour-accessibility-guide",
    "cityOrTown": "Coffs Harbour",
    "title": "Coffs Harbour Accessibility Guide",
    "latitude": -30.2963,
    "longitude": 153.1135,
    "guideType": "Regional town",
    "href": "/guides/nsw/coffs-harbour-accessibility-guide",
    "priorityTier": "Tier 2",
    "tier": "Tier 2",
    "launchAngle": "Coastal tourism and regional services",
    "summary": "Coastal tourism and regional services",
    "mappingMissions": [
      "Map beach access, marina routes, accessible accommodation cluster"
    ],
    "keyAccessThemes": [
      "Map beach access, marina routes, accessible accommodation cluster"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-nsw-port-macquarie",
    "state": "NSW",
    "stateSlug": "nsw",
    "city": "Port Macquarie",
    "citySlug": "port-macquarie-accessibility-guide",
    "cityOrTown": "Port Macquarie",
    "title": "Port Macquarie Accessibility Guide",
    "latitude": -31.4333,
    "longitude": 152.9,
    "guideType": "Regional town",
    "href": "/guides/nsw/port-macquarie-accessibility-guide",
    "priorityTier": "Tier 2",
    "tier": "Tier 2",
    "launchAngle": "Accessible coastal tourism and health services",
    "summary": "Accessible coastal tourism and health services",
    "mappingMissions": [
      "Verify coastal walk alternatives, accessible toilets, hospital access"
    ],
    "keyAccessThemes": [
      "Verify coastal walk alternatives, accessible toilets, hospital access"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-nsw-tamworth",
    "state": "NSW",
    "stateSlug": "nsw",
    "city": "Tamworth",
    "citySlug": "tamworth-accessibility-guide",
    "cityOrTown": "Tamworth",
    "title": "Tamworth Accessibility Guide",
    "latitude": -31.0927,
    "longitude": 150.929,
    "guideType": "Regional town",
    "href": "/guides/nsw/tamworth-accessibility-guide",
    "priorityTier": "Tier 2",
    "tier": "Tier 2",
    "launchAngle": "Events, country music venues and regional transport",
    "summary": "Events, country music venues and regional transport",
    "mappingMissions": [
      "Audit event venues, accommodation, accessible parking"
    ],
    "keyAccessThemes": [
      "Audit event venues, accommodation, accessible parking"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-nsw-dubbo",
    "state": "NSW",
    "stateSlug": "nsw",
    "city": "Dubbo",
    "citySlug": "dubbo-accessibility-guide",
    "cityOrTown": "Dubbo",
    "title": "Dubbo Accessibility Guide",
    "latitude": -32.2569,
    "longitude": 148.6011,
    "guideType": "Regional city",
    "href": "/guides/nsw/dubbo-accessibility-guide",
    "priorityTier": "Tier 2",
    "tier": "Tier 2",
    "launchAngle": "Zoo, health services and western NSW hub",
    "summary": "Zoo, health services and western NSW hub",
    "mappingMissions": [
      "Verify zoo access, accessible taxis, hospital precinct"
    ],
    "keyAccessThemes": [
      "Verify zoo access, accessible taxis, hospital precinct"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-nsw-orange",
    "state": "NSW",
    "stateSlug": "nsw",
    "city": "Orange",
    "citySlug": "orange-accessibility-guide",
    "cityOrTown": "Orange",
    "title": "Orange Accessibility Guide",
    "latitude": -33.2833,
    "longitude": 149.1,
    "guideType": "Regional town",
    "href": "/guides/nsw/orange-accessibility-guide",
    "priorityTier": "Tier 3",
    "tier": "Tier 3",
    "launchAngle": "Food, wine, hospital and heritage precincts",
    "summary": "Food, wine, hospital and heritage precincts",
    "mappingMissions": [
      "Map accessible dining, gradients, toilets"
    ],
    "keyAccessThemes": [
      "Map accessible dining, gradients, toilets"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-nsw-wagga-wagga",
    "state": "NSW",
    "stateSlug": "nsw",
    "city": "Wagga Wagga",
    "citySlug": "wagga-wagga-accessibility-guide",
    "cityOrTown": "Wagga Wagga",
    "title": "Wagga Wagga Accessibility Guide",
    "latitude": -35.1082,
    "longitude": 147.3598,
    "guideType": "Regional city",
    "href": "/guides/nsw/wagga-wagga-accessibility-guide",
    "priorityTier": "Tier 2",
    "tier": "Tier 2",
    "launchAngle": "Riverina health, education and transport hub",
    "summary": "Riverina health, education and transport hub",
    "mappingMissions": [
      "Verify station, hospital, civic precinct and river paths"
    ],
    "keyAccessThemes": [
      "Verify station, hospital, civic precinct and river paths"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-nsw-albury",
    "state": "NSW",
    "stateSlug": "nsw",
    "city": "Albury",
    "citySlug": "albury-accessibility-guide",
    "cityOrTown": "Albury",
    "title": "Albury Accessibility Guide",
    "latitude": -36.0737,
    "longitude": 146.9135,
    "guideType": "Regional city",
    "href": "/guides/nsw/albury-accessibility-guide",
    "priorityTier": "Tier 2",
    "tier": "Tier 2",
    "launchAngle": "Cross-border access with Wodonga",
    "summary": "Cross-border access with Wodonga",
    "mappingMissions": [
      "Map rail/coach, river paths, hospital and civic routes"
    ],
    "keyAccessThemes": [
      "Map rail/coach, river paths, hospital and civic routes"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-nsw-bathurst",
    "state": "NSW",
    "stateSlug": "nsw",
    "city": "Bathurst",
    "citySlug": "bathurst-accessibility-guide",
    "cityOrTown": "Bathurst",
    "title": "Bathurst Accessibility Guide",
    "latitude": -33.4193,
    "longitude": 149.5775,
    "guideType": "Regional town",
    "href": "/guides/nsw/bathurst-accessibility-guide",
    "priorityTier": "Tier 3",
    "tier": "Tier 3",
    "launchAngle": "Events, university and heritage access",
    "summary": "Events, university and heritage access",
    "mappingMissions": [
      "Audit event venues, heritage entrances, toilets"
    ],
    "keyAccessThemes": [
      "Audit event venues, heritage entrances, toilets"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-nsw-lismore-byron",
    "state": "NSW",
    "stateSlug": "nsw",
    "city": "Lismore / Byron Bay",
    "citySlug": "lismore-byron-accessibility-guide",
    "cityOrTown": "Lismore / Byron Bay",
    "title": "Lismore / Byron Bay Accessibility Guide",
    "latitude": -28.8142,
    "longitude": 153.278,
    "guideType": "Regional area",
    "href": "/guides/nsw/lismore-byron-accessibility-guide",
    "priorityTier": "Tier 2",
    "tier": "Tier 2",
    "launchAngle": "Flood-aware services and accessible tourism",
    "summary": "Flood-aware services and accessible tourism",
    "mappingMissions": [
      "Map evacuation-aware facilities, beach access, transport gaps"
    ],
    "keyAccessThemes": [
      "Map evacuation-aware facilities, beach access, transport gaps"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-vic-geelong",
    "state": "VIC",
    "stateSlug": "vic",
    "city": "Geelong",
    "citySlug": "geelong-accessibility-guide",
    "cityOrTown": "Geelong",
    "title": "Geelong Accessibility Guide",
    "latitude": -38.1499,
    "longitude": 144.3617,
    "guideType": "Regional city",
    "href": "/guides/vic/geelong-accessibility-guide",
    "priorityTier": "Tier 1",
    "tier": "Tier 1",
    "launchAngle": "Waterfront, hospitals and Bellarine gateway",
    "summary": "Waterfront, hospitals and Bellarine gateway",
    "mappingMissions": [
      "Verify waterfront paths, station access, beach infrastructure"
    ],
    "keyAccessThemes": [
      "Verify waterfront paths, station access, beach infrastructure"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-vic-ballarat",
    "state": "VIC",
    "stateSlug": "vic",
    "city": "Ballarat",
    "citySlug": "ballarat-accessibility-guide",
    "cityOrTown": "Ballarat",
    "title": "Ballarat Accessibility Guide",
    "latitude": -37.5622,
    "longitude": 143.8503,
    "guideType": "Regional city",
    "href": "/guides/vic/ballarat-accessibility-guide",
    "priorityTier": "Tier 1",
    "tier": "Tier 1",
    "launchAngle": "Heritage, events and regional rail access",
    "summary": "Heritage, events and regional rail access",
    "mappingMissions": [
      "Map gradients, heritage entries, station-to-CBD routes"
    ],
    "keyAccessThemes": [
      "Map gradients, heritage entries, station-to-CBD routes"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-vic-bendigo",
    "state": "VIC",
    "stateSlug": "vic",
    "city": "Bendigo",
    "citySlug": "bendigo-accessibility-guide",
    "cityOrTown": "Bendigo",
    "title": "Bendigo Accessibility Guide",
    "latitude": -36.757,
    "longitude": 144.2794,
    "guideType": "Regional city",
    "href": "/guides/vic/bendigo-accessibility-guide",
    "priorityTier": "Tier 1",
    "tier": "Tier 1",
    "launchAngle": "Arts, hospital, heritage and tram tourism",
    "summary": "Arts, hospital, heritage and tram tourism",
    "mappingMissions": [
      "Verify gallery/heritage access, hospital routes, toilets"
    ],
    "keyAccessThemes": [
      "Verify gallery/heritage access, hospital routes, toilets"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-vic-shepparton",
    "state": "VIC",
    "stateSlug": "vic",
    "city": "Shepparton",
    "citySlug": "shepparton-accessibility-guide",
    "cityOrTown": "Shepparton",
    "title": "Shepparton Accessibility Guide",
    "latitude": -36.3806,
    "longitude": 145.398,
    "guideType": "Regional city",
    "href": "/guides/vic/shepparton-accessibility-guide",
    "priorityTier": "Tier 2",
    "tier": "Tier 2",
    "launchAngle": "Health, multicultural services and regional transport",
    "summary": "Health, multicultural services and regional transport",
    "mappingMissions": [
      "Map hospital access, civic services, public toilets"
    ],
    "keyAccessThemes": [
      "Map hospital access, civic services, public toilets"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-vic-mildura",
    "state": "VIC",
    "stateSlug": "vic",
    "city": "Mildura",
    "citySlug": "mildura-accessibility-guide",
    "cityOrTown": "Mildura",
    "title": "Mildura Accessibility Guide",
    "latitude": -34.185,
    "longitude": 142.1625,
    "guideType": "Regional city",
    "href": "/guides/vic/mildura-accessibility-guide",
    "priorityTier": "Tier 2",
    "tier": "Tier 2",
    "launchAngle": "Murray River tourism and regional service hub",
    "summary": "Murray River tourism and regional service hub",
    "mappingMissions": [
      "Verify riverfront access, heat-aware routes, accessible taxis"
    ],
    "keyAccessThemes": [
      "Verify riverfront access, heat-aware routes, accessible taxis"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-vic-warrnambool",
    "state": "VIC",
    "stateSlug": "vic",
    "city": "Warrnambool",
    "citySlug": "warrnambool-accessibility-guide",
    "cityOrTown": "Warrnambool",
    "title": "Warrnambool Accessibility Guide",
    "latitude": -38.3818,
    "longitude": 142.487,
    "guideType": "Regional city",
    "href": "/guides/vic/warrnambool-accessibility-guide",
    "priorityTier": "Tier 2",
    "tier": "Tier 2",
    "launchAngle": "Coastal tourism and regional health",
    "summary": "Coastal tourism and regional health",
    "mappingMissions": [
      "Map beach lookouts, station access, hospital routes"
    ],
    "keyAccessThemes": [
      "Map beach lookouts, station access, hospital routes"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-vic-latrobe-valley",
    "state": "VIC",
    "stateSlug": "vic",
    "city": "Traralgon / Latrobe Valley",
    "citySlug": "latrobe-valley-accessibility-guide",
    "cityOrTown": "Traralgon / Latrobe Valley",
    "title": "Traralgon / Latrobe Valley Accessibility Guide",
    "latitude": -38.195,
    "longitude": 146.54,
    "guideType": "Regional area",
    "href": "/guides/vic/latrobe-valley-accessibility-guide",
    "priorityTier": "Tier 2",
    "tier": "Tier 2",
    "launchAngle": "Industry, services and Gippsland access",
    "summary": "Industry, services and Gippsland access",
    "mappingMissions": [
      "Audit intertown transport, health precincts, civic centres"
    ],
    "keyAccessThemes": [
      "Audit intertown transport, health precincts, civic centres"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-vic-wangaratta",
    "state": "VIC",
    "stateSlug": "vic",
    "city": "Wangaratta",
    "citySlug": "wangaratta-accessibility-guide",
    "cityOrTown": "Wangaratta",
    "title": "Wangaratta Accessibility Guide",
    "latitude": -36.3567,
    "longitude": 146.312,
    "guideType": "Regional town",
    "href": "/guides/vic/wangaratta-accessibility-guide",
    "priorityTier": "Tier 3",
    "tier": "Tier 3",
    "launchAngle": "Rail-linked regional town and health services",
    "summary": "Rail-linked regional town and health services",
    "mappingMissions": [
      "Verify station, hospital and accessible toilets"
    ],
    "keyAccessThemes": [
      "Verify station, hospital and accessible toilets"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-vic-wodonga",
    "state": "VIC",
    "stateSlug": "vic",
    "city": "Wodonga",
    "citySlug": "wodonga-accessibility-guide",
    "cityOrTown": "Wodonga",
    "title": "Wodonga Accessibility Guide",
    "latitude": -36.12,
    "longitude": 146.888,
    "guideType": "Regional city",
    "href": "/guides/vic/wodonga-accessibility-guide",
    "priorityTier": "Tier 2",
    "tier": "Tier 2",
    "launchAngle": "Cross-border access with Albury",
    "summary": "Cross-border access with Albury",
    "mappingMissions": [
      "Map regional transport, river/civic routes, hospital access"
    ],
    "keyAccessThemes": [
      "Map regional transport, river/civic routes, hospital access"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-qld-gold-coast",
    "state": "QLD",
    "stateSlug": "qld",
    "city": "Gold Coast",
    "citySlug": "gold-coast-accessibility-guide",
    "cityOrTown": "Gold Coast",
    "title": "Gold Coast Accessibility Guide",
    "latitude": -28.0167,
    "longitude": 153.4,
    "guideType": "Regional city",
    "href": "/guides/qld/gold-coast-accessibility-guide",
    "priorityTier": "Tier 1",
    "tier": "Tier 1",
    "launchAngle": "Beaches, light rail, theme parks and events",
    "summary": "Beaches, light rail, theme parks and events",
    "mappingMissions": [
      "Verify beach mats, tram stops, accessible accommodation and toilets"
    ],
    "keyAccessThemes": [
      "Verify beach mats, tram stops, accessible accommodation and toilets"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-qld-sunshine-coast",
    "state": "QLD",
    "stateSlug": "qld",
    "city": "Sunshine Coast",
    "citySlug": "sunshine-coast-accessibility-guide",
    "cityOrTown": "Sunshine Coast",
    "title": "Sunshine Coast Accessibility Guide",
    "latitude": -26.65,
    "longitude": 153.0667,
    "guideType": "Regional area",
    "href": "/guides/qld/sunshine-coast-accessibility-guide",
    "priorityTier": "Tier 1",
    "tier": "Tier 1",
    "launchAngle": "Beaches, hinterland and health services",
    "summary": "Beaches, hinterland and health services",
    "mappingMissions": [
      "Map beach access, shade, toilets and transport gaps"
    ],
    "keyAccessThemes": [
      "Map beach access, shade, toilets and transport gaps"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-qld-cairns",
    "state": "QLD",
    "stateSlug": "qld",
    "city": "Cairns",
    "citySlug": "cairns-accessibility-guide",
    "cityOrTown": "Cairns",
    "title": "Cairns Accessibility Guide",
    "latitude": -16.9186,
    "longitude": 145.7781,
    "guideType": "Regional city",
    "href": "/guides/qld/cairns-accessibility-guide",
    "priorityTier": "Tier 1",
    "tier": "Tier 1",
    "launchAngle": "Reef gateway, heat-aware tourism and hospital access",
    "summary": "Reef gateway, heat-aware tourism and hospital access",
    "mappingMissions": [
      "Verify marina access, tour operators, accessible taxis"
    ],
    "keyAccessThemes": [
      "Verify marina access, tour operators, accessible taxis"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-qld-townsville",
    "state": "QLD",
    "stateSlug": "qld",
    "city": "Townsville",
    "citySlug": "townsville-accessibility-guide",
    "cityOrTown": "Townsville",
    "title": "Townsville Accessibility Guide",
    "latitude": -19.259,
    "longitude": 146.8169,
    "guideType": "Regional city",
    "href": "/guides/qld/townsville-accessibility-guide",
    "priorityTier": "Tier 1",
    "tier": "Tier 1",
    "launchAngle": "Strand, Magnetic Island gateway and regional health",
    "summary": "Strand, Magnetic Island gateway and regional health",
    "mappingMissions": [
      "Map ferry access, waterfront paths, hospital and CBD"
    ],
    "keyAccessThemes": [
      "Map ferry access, waterfront paths, hospital and CBD"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-qld-toowoomba",
    "state": "QLD",
    "stateSlug": "qld",
    "city": "Toowoomba",
    "citySlug": "toowoomba-accessibility-guide",
    "cityOrTown": "Toowoomba",
    "title": "Toowoomba Accessibility Guide",
    "latitude": -27.5598,
    "longitude": 151.9507,
    "guideType": "Regional city",
    "href": "/guides/qld/toowoomba-accessibility-guide",
    "priorityTier": "Tier 2",
    "tier": "Tier 2",
    "launchAngle": "Gardens, events, hills and health services",
    "summary": "Gardens, events, hills and health services",
    "mappingMissions": [
      "Verify gradients, parks, event venues and toilets"
    ],
    "keyAccessThemes": [
      "Verify gradients, parks, event venues and toilets"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-qld-mackay",
    "state": "QLD",
    "stateSlug": "qld",
    "city": "Mackay",
    "citySlug": "mackay-accessibility-guide",
    "cityOrTown": "Mackay",
    "title": "Mackay Accessibility Guide",
    "latitude": -21.141,
    "longitude": 149.186,
    "guideType": "Regional city",
    "href": "/guides/qld/mackay-accessibility-guide",
    "priorityTier": "Tier 2",
    "tier": "Tier 2",
    "launchAngle": "Regional services, beaches and mining-region access",
    "summary": "Regional services, beaches and mining-region access",
    "mappingMissions": [
      "Map bus links, beaches, hospital and civic spaces"
    ],
    "keyAccessThemes": [
      "Map bus links, beaches, hospital and civic spaces"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-qld-rockhampton",
    "state": "QLD",
    "stateSlug": "qld",
    "city": "Rockhampton",
    "citySlug": "rockhampton-accessibility-guide",
    "cityOrTown": "Rockhampton",
    "title": "Rockhampton Accessibility Guide",
    "latitude": -23.3781,
    "longitude": 150.5136,
    "guideType": "Regional city",
    "href": "/guides/qld/rockhampton-accessibility-guide",
    "priorityTier": "Tier 2",
    "tier": "Tier 2",
    "launchAngle": "Beef capital, riverfront and health services",
    "summary": "Beef capital, riverfront and health services",
    "mappingMissions": [
      "Verify riverfront, showgrounds, hospital routes"
    ],
    "keyAccessThemes": [
      "Verify riverfront, showgrounds, hospital routes"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-qld-bundaberg",
    "state": "QLD",
    "stateSlug": "qld",
    "city": "Bundaberg",
    "citySlug": "bundaberg-accessibility-guide",
    "cityOrTown": "Bundaberg",
    "title": "Bundaberg Accessibility Guide",
    "latitude": -24.8661,
    "longitude": 152.3489,
    "guideType": "Regional city",
    "href": "/guides/qld/bundaberg-accessibility-guide",
    "priorityTier": "Tier 2",
    "tier": "Tier 2",
    "launchAngle": "Tourism, health and coastal access",
    "summary": "Tourism, health and coastal access",
    "mappingMissions": [
      "Map accessible beaches, turtle tourism, hospital access"
    ],
    "keyAccessThemes": [
      "Map accessible beaches, turtle tourism, hospital access"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-qld-hervey-bay",
    "state": "QLD",
    "stateSlug": "qld",
    "city": "Hervey Bay",
    "citySlug": "hervey-bay-accessibility-guide",
    "cityOrTown": "Hervey Bay",
    "title": "Hervey Bay Accessibility Guide",
    "latitude": -25.2882,
    "longitude": 152.829,
    "guideType": "Regional city",
    "href": "/guides/qld/hervey-bay-accessibility-guide",
    "priorityTier": "Tier 2",
    "tier": "Tier 2",
    "launchAngle": "Whale watching, foreshore and Fraser Coast access",
    "summary": "Whale watching, foreshore and Fraser Coast access",
    "mappingMissions": [
      "Verify tour operators, foreshore paths, accessible toilets"
    ],
    "keyAccessThemes": [
      "Verify tour operators, foreshore paths, accessible toilets"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-qld-mount-isa",
    "state": "QLD",
    "stateSlug": "qld",
    "city": "Mount Isa",
    "citySlug": "mount-isa-accessibility-guide",
    "cityOrTown": "Mount Isa",
    "title": "Mount Isa Accessibility Guide",
    "latitude": -20.7256,
    "longitude": 139.4927,
    "guideType": "Regional city",
    "href": "/guides/qld/mount-isa-accessibility-guide",
    "priorityTier": "Tier 3",
    "tier": "Tier 3",
    "launchAngle": "Remote services and heat-aware access",
    "summary": "Remote services and heat-aware access",
    "mappingMissions": [
      "Map health precinct, taxis, shade and public toilets"
    ],
    "keyAccessThemes": [
      "Map health precinct, taxis, shade and public toilets"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-sa-mount-gambier",
    "state": "SA",
    "stateSlug": "sa",
    "city": "Mount Gambier",
    "citySlug": "mount-gambier-accessibility-guide",
    "cityOrTown": "Mount Gambier",
    "title": "Mount Gambier Accessibility Guide",
    "latitude": -37.828,
    "longitude": 140.782,
    "guideType": "Regional city",
    "href": "/guides/sa/mount-gambier-accessibility-guide",
    "priorityTier": "Tier 2",
    "tier": "Tier 2",
    "launchAngle": "Limestone Coast tourism and health services",
    "summary": "Limestone Coast tourism and health services",
    "mappingMissions": [
      "Verify sinkhole/garden access, toilets, hospital routes"
    ],
    "keyAccessThemes": [
      "Verify sinkhole/garden access, toilets, hospital routes"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-sa-whyalla",
    "state": "SA",
    "stateSlug": "sa",
    "city": "Whyalla",
    "citySlug": "whyalla-accessibility-guide",
    "cityOrTown": "Whyalla",
    "title": "Whyalla Accessibility Guide",
    "latitude": -33.0333,
    "longitude": 137.5833,
    "guideType": "Regional city",
    "href": "/guides/sa/whyalla-accessibility-guide",
    "priorityTier": "Tier 3",
    "tier": "Tier 3",
    "launchAngle": "Spencer Gulf access and regional services",
    "summary": "Spencer Gulf access and regional services",
    "mappingMissions": [
      "Map foreshore, hospital, civic services"
    ],
    "keyAccessThemes": [
      "Map foreshore, hospital, civic services"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-sa-port-lincoln",
    "state": "SA",
    "stateSlug": "sa",
    "city": "Port Lincoln",
    "citySlug": "port-lincoln-accessibility-guide",
    "cityOrTown": "Port Lincoln",
    "title": "Port Lincoln Accessibility Guide",
    "latitude": -34.7333,
    "longitude": 135.8667,
    "guideType": "Regional town",
    "href": "/guides/sa/port-lincoln-accessibility-guide",
    "priorityTier": "Tier 3",
    "tier": "Tier 3",
    "launchAngle": "Eyre Peninsula tourism and coastal access",
    "summary": "Eyre Peninsula tourism and coastal access",
    "mappingMissions": [
      "Verify marina, foreshore and accommodation access"
    ],
    "keyAccessThemes": [
      "Verify marina, foreshore and accommodation access"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-sa-murray-bridge",
    "state": "SA",
    "stateSlug": "sa",
    "city": "Murray Bridge",
    "citySlug": "murray-bridge-accessibility-guide",
    "cityOrTown": "Murray Bridge",
    "title": "Murray Bridge Accessibility Guide",
    "latitude": -35.119,
    "longitude": 139.275,
    "guideType": "Regional town",
    "href": "/guides/sa/murray-bridge-accessibility-guide",
    "priorityTier": "Tier 3",
    "tier": "Tier 3",
    "launchAngle": "Murray River routes and regional services",
    "summary": "Murray River routes and regional services",
    "mappingMissions": [
      "Map riverfront, toilets, civic access"
    ],
    "keyAccessThemes": [
      "Map riverfront, toilets, civic access"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-sa-victor-harbor",
    "state": "SA",
    "stateSlug": "sa",
    "city": "Victor Harbor",
    "citySlug": "victor-harbor-accessibility-guide",
    "cityOrTown": "Victor Harbor",
    "title": "Victor Harbor Accessibility Guide",
    "latitude": -35.552,
    "longitude": 138.621,
    "guideType": "Regional town",
    "href": "/guides/sa/victor-harbor-accessibility-guide",
    "priorityTier": "Tier 2",
    "tier": "Tier 2",
    "launchAngle": "Coastal day trips and older-traveller access",
    "summary": "Coastal day trips and older-traveller access",
    "mappingMissions": [
      "Verify foreshore, causeway, toilets and parking"
    ],
    "keyAccessThemes": [
      "Verify foreshore, causeway, toilets and parking"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-sa-port-augusta",
    "state": "SA",
    "stateSlug": "sa",
    "city": "Port Augusta",
    "citySlug": "port-augusta-accessibility-guide",
    "cityOrTown": "Port Augusta",
    "title": "Port Augusta Accessibility Guide",
    "latitude": -32.4925,
    "longitude": 137.763,
    "guideType": "Regional town",
    "href": "/guides/sa/port-augusta-accessibility-guide",
    "priorityTier": "Tier 3",
    "tier": "Tier 3",
    "launchAngle": "Gateway to north SA and remote travel",
    "summary": "Gateway to north SA and remote travel",
    "mappingMissions": [
      "Map transport, hospital and rest facilities"
    ],
    "keyAccessThemes": [
      "Map transport, hospital and rest facilities"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-wa-bunbury",
    "state": "WA",
    "stateSlug": "wa",
    "city": "Bunbury",
    "citySlug": "bunbury-accessibility-guide",
    "cityOrTown": "Bunbury",
    "title": "Bunbury Accessibility Guide",
    "latitude": -33.327,
    "longitude": 115.641,
    "guideType": "Regional city",
    "href": "/guides/wa/bunbury-accessibility-guide",
    "priorityTier": "Tier 1",
    "tier": "Tier 1",
    "launchAngle": "South West hub, beaches and health services",
    "summary": "South West hub, beaches and health services",
    "mappingMissions": [
      "Verify foreshore, station/bus, hospital, beach access"
    ],
    "keyAccessThemes": [
      "Verify foreshore, station/bus, hospital, beach access"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-wa-busselton",
    "state": "WA",
    "stateSlug": "wa",
    "city": "Busselton",
    "citySlug": "busselton-accessibility-guide",
    "cityOrTown": "Busselton",
    "title": "Busselton Accessibility Guide",
    "latitude": -33.653,
    "longitude": 115.345,
    "guideType": "Regional city",
    "href": "/guides/wa/busselton-accessibility-guide",
    "priorityTier": "Tier 1",
    "tier": "Tier 1",
    "launchAngle": "Jetty tourism and beach access",
    "summary": "Jetty tourism and beach access",
    "mappingMissions": [
      "Map jetty access, beach equipment, accessible toilets"
    ],
    "keyAccessThemes": [
      "Map jetty access, beach equipment, accessible toilets"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-wa-albany",
    "state": "WA",
    "stateSlug": "wa",
    "city": "Albany",
    "citySlug": "albany-accessibility-guide",
    "cityOrTown": "Albany",
    "title": "Albany Accessibility Guide",
    "latitude": -35.0269,
    "longitude": 117.8837,
    "guideType": "Regional city",
    "href": "/guides/wa/albany-accessibility-guide",
    "priorityTier": "Tier 2",
    "tier": "Tier 2",
    "launchAngle": "Heritage, coast and Great Southern services",
    "summary": "Heritage, coast and Great Southern services",
    "mappingMissions": [
      "Verify lookouts, foreshore paths, hospital access"
    ],
    "keyAccessThemes": [
      "Verify lookouts, foreshore paths, hospital access"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-wa-geraldton",
    "state": "WA",
    "stateSlug": "wa",
    "city": "Geraldton",
    "citySlug": "geraldton-accessibility-guide",
    "cityOrTown": "Geraldton",
    "title": "Geraldton Accessibility Guide",
    "latitude": -28.774,
    "longitude": 114.609,
    "guideType": "Regional city",
    "href": "/guides/wa/geraldton-accessibility-guide",
    "priorityTier": "Tier 2",
    "tier": "Tier 2",
    "launchAngle": "Mid West coastal access and health services",
    "summary": "Mid West coastal access and health services",
    "mappingMissions": [
      "Map foreshore, civic precinct, accessible taxis"
    ],
    "keyAccessThemes": [
      "Map foreshore, civic precinct, accessible taxis"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-wa-kalgoorlie",
    "state": "WA",
    "stateSlug": "wa",
    "city": "Kalgoorlie",
    "citySlug": "kalgoorlie-accessibility-guide",
    "cityOrTown": "Kalgoorlie",
    "title": "Kalgoorlie Accessibility Guide",
    "latitude": -30.7489,
    "longitude": 121.4659,
    "guideType": "Regional city",
    "href": "/guides/wa/kalgoorlie-accessibility-guide",
    "priorityTier": "Tier 3",
    "tier": "Tier 3",
    "launchAngle": "Goldfields access and regional services",
    "summary": "Goldfields access and regional services",
    "mappingMissions": [
      "Verify airport, hospital, accommodation and civic routes"
    ],
    "keyAccessThemes": [
      "Verify airport, hospital, accommodation and civic routes"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-wa-broome",
    "state": "WA",
    "stateSlug": "wa",
    "city": "Broome",
    "citySlug": "broome-accessibility-guide",
    "cityOrTown": "Broome",
    "title": "Broome Accessibility Guide",
    "latitude": -17.9614,
    "longitude": 122.2359,
    "guideType": "Regional town",
    "href": "/guides/wa/broome-accessibility-guide",
    "priorityTier": "Tier 2",
    "tier": "Tier 2",
    "launchAngle": "Accessible tourism, heat and seasonal access",
    "summary": "Accessible tourism, heat and seasonal access",
    "mappingMissions": [
      "Map Cable Beach access, taxis, shade and toilets"
    ],
    "keyAccessThemes": [
      "Map Cable Beach access, taxis, shade and toilets"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-wa-karratha",
    "state": "WA",
    "stateSlug": "wa",
    "city": "Karratha",
    "citySlug": "karratha-accessibility-guide",
    "cityOrTown": "Karratha",
    "title": "Karratha Accessibility Guide",
    "latitude": -20.7377,
    "longitude": 116.846,
    "guideType": "Regional city",
    "href": "/guides/wa/karratha-accessibility-guide",
    "priorityTier": "Tier 3",
    "tier": "Tier 3",
    "launchAngle": "Pilbara services and heat-aware access",
    "summary": "Pilbara services and heat-aware access",
    "mappingMissions": [
      "Verify health services, taxis, civic facilities"
    ],
    "keyAccessThemes": [
      "Verify health services, taxis, civic facilities"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-wa-margaret-river",
    "state": "WA",
    "stateSlug": "wa",
    "city": "Margaret River",
    "citySlug": "margaret-river-accessibility-guide",
    "cityOrTown": "Margaret River",
    "title": "Margaret River Accessibility Guide",
    "latitude": -33.955,
    "longitude": 115.075,
    "guideType": "Regional town",
    "href": "/guides/wa/margaret-river-accessibility-guide",
    "priorityTier": "Tier 2",
    "tier": "Tier 2",
    "launchAngle": "Accessible food, wine and nature tourism",
    "summary": "Accessible food, wine and nature tourism",
    "mappingMissions": [
      "Map wineries, toilets, beach access and transport gaps"
    ],
    "keyAccessThemes": [
      "Map wineries, toilets, beach access and transport gaps"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-tas-launceston",
    "state": "TAS",
    "stateSlug": "tas",
    "city": "Launceston",
    "citySlug": "launceston-accessibility-guide",
    "cityOrTown": "Launceston",
    "title": "Launceston Accessibility Guide",
    "latitude": -41.4332,
    "longitude": 147.1441,
    "guideType": "Regional city",
    "href": "/guides/tas/launceston-accessibility-guide",
    "priorityTier": "Tier 1",
    "tier": "Tier 1",
    "launchAngle": "Heritage, parks and northern Tasmania services",
    "summary": "Heritage, parks and northern Tasmania services",
    "mappingMissions": [
      "Verify gradients, Cataract Gorge options, bus access"
    ],
    "keyAccessThemes": [
      "Verify gradients, Cataract Gorge options, bus access"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-tas-devonport",
    "state": "TAS",
    "stateSlug": "tas",
    "city": "Devonport",
    "citySlug": "devonport-accessibility-guide",
    "cityOrTown": "Devonport",
    "title": "Devonport Accessibility Guide",
    "latitude": -41.18,
    "longitude": 146.35,
    "guideType": "Regional city",
    "href": "/guides/tas/devonport-accessibility-guide",
    "priorityTier": "Tier 2",
    "tier": "Tier 2",
    "launchAngle": "Ferry gateway and north-west services",
    "summary": "Ferry gateway and north-west services",
    "mappingMissions": [
      "Map ferry terminal, foreshore, toilets and transport"
    ],
    "keyAccessThemes": [
      "Map ferry terminal, foreshore, toilets and transport"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-tas-burnie",
    "state": "TAS",
    "stateSlug": "tas",
    "city": "Burnie",
    "citySlug": "burnie-accessibility-guide",
    "cityOrTown": "Burnie",
    "title": "Burnie Accessibility Guide",
    "latitude": -41.055,
    "longitude": 145.907,
    "guideType": "Regional city",
    "href": "/guides/tas/burnie-accessibility-guide",
    "priorityTier": "Tier 2",
    "tier": "Tier 2",
    "launchAngle": "North-west health and coastal access",
    "summary": "North-west health and coastal access",
    "mappingMissions": [
      "Verify buses, foreshore and civic facilities"
    ],
    "keyAccessThemes": [
      "Verify buses, foreshore and civic facilities"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-tas-west-coast",
    "state": "TAS",
    "stateSlug": "tas",
    "city": "Queenstown / West Coast",
    "citySlug": "west-coast-accessibility-guide",
    "cityOrTown": "Queenstown / West Coast",
    "title": "Queenstown / West Coast Accessibility Guide",
    "latitude": -42.08,
    "longitude": 145.55,
    "guideType": "Regional area",
    "href": "/guides/tas/west-coast-accessibility-guide",
    "priorityTier": "Tier 3",
    "tier": "Tier 3",
    "launchAngle": "Remote tourism and heritage rail access",
    "summary": "Remote tourism and heritage rail access",
    "mappingMissions": [
      "Map gradients, transport gaps, accommodation access"
    ],
    "keyAccessThemes": [
      "Map gradients, transport gaps, accommodation access"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-nt-alice-springs",
    "state": "NT",
    "stateSlug": "nt",
    "city": "Alice Springs",
    "citySlug": "alice-springs-accessibility-guide",
    "cityOrTown": "Alice Springs",
    "title": "Alice Springs Accessibility Guide",
    "latitude": -23.698,
    "longitude": 133.8807,
    "guideType": "Regional town",
    "href": "/guides/nt/alice-springs-accessibility-guide",
    "priorityTier": "Tier 1",
    "tier": "Tier 1",
    "launchAngle": "Central Australia access, heat and remote services",
    "summary": "Central Australia access, heat and remote services",
    "mappingMissions": [
      "Verify taxis, bus routes, cultural venues and health services"
    ],
    "keyAccessThemes": [
      "Verify taxis, bus routes, cultural venues and health services"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-nt-katherine",
    "state": "NT",
    "stateSlug": "nt",
    "city": "Katherine",
    "citySlug": "katherine-accessibility-guide",
    "cityOrTown": "Katherine",
    "title": "Katherine Accessibility Guide",
    "latitude": -14.466,
    "longitude": 132.263,
    "guideType": "Regional town",
    "href": "/guides/nt/katherine-accessibility-guide",
    "priorityTier": "Tier 2",
    "tier": "Tier 2",
    "launchAngle": "Regional services and national park gateway",
    "summary": "Regional services and national park gateway",
    "mappingMissions": [
      "Map hospital, civic facilities, tour operator access"
    ],
    "keyAccessThemes": [
      "Map hospital, civic facilities, tour operator access"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-nt-palmerston",
    "state": "NT",
    "stateSlug": "nt",
    "city": "Palmerston",
    "citySlug": "palmerston-accessibility-guide",
    "cityOrTown": "Palmerston",
    "title": "Palmerston Accessibility Guide",
    "latitude": -12.48,
    "longitude": 130.983,
    "guideType": "Regional city",
    "href": "/guides/nt/palmerston-accessibility-guide",
    "priorityTier": "Tier 2",
    "tier": "Tier 2",
    "launchAngle": "Darwin-region services and transport links",
    "summary": "Darwin-region services and transport links",
    "mappingMissions": [
      "Verify bus stops, civic precinct, parks and toilets"
    ],
    "keyAccessThemes": [
      "Verify bus stops, civic precinct, parks and toilets"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  },
  {
    "id": "guide-nt-tennant-creek",
    "state": "NT",
    "stateSlug": "nt",
    "city": "Tennant Creek",
    "citySlug": "tennant-creek-accessibility-guide",
    "cityOrTown": "Tennant Creek",
    "title": "Tennant Creek Accessibility Guide",
    "latitude": -19.649,
    "longitude": 134.185,
    "guideType": "Regional town",
    "href": "/guides/nt/tennant-creek-accessibility-guide",
    "priorityTier": "Tier 3",
    "tier": "Tier 3",
    "launchAngle": "Remote access and essential services",
    "summary": "Remote access and essential services",
    "mappingMissions": [
      "Map clinic, transport, toilets and accommodation"
    ],
    "keyAccessThemes": [
      "Map clinic, transport, toilets and accommodation"
    ],
    "status": "Needs local verification",
    "statusKey": "needs_verification"
  }
];

export function getGuideTitle(guide: AccessGuide): string {
  return guide.title;
}

export function getCapitalAccessGuides(): AccessGuide[] {
  return accessGuides.filter((g) => g.priorityTier === "Capital launch");
}

export function getAccessGuideBySlug(
  stateSlug: string,
  citySlug: string,
): AccessGuide | undefined {
  return accessGuides.find(
    (g) => g.stateSlug === stateSlug && g.citySlug === citySlug,
  );
}

export function getAccessGuideById(id: string): AccessGuide | undefined {
  return accessGuides.find((g) => g.id === id);
}

export function getAccessGuidesByTier(tier: string): AccessGuide[] {
  return accessGuides.filter((g) => g.priorityTier === tier);
}

export function getGuidesForMap(): AccessGuide[] {
  return accessGuides.filter(
    (g) =>
      Number.isFinite(g.latitude) &&
      Number.isFinite(g.longitude) &&
      !(g.latitude === 0 && g.longitude === 0),
  );
}

export type AccessGuideFilterInput = {
  query?: string;
  state?: string | null;
  tier?: string | null;
  status?: AccessGuideStatusKey | null;
};

export function filterAccessGuides(
  input: AccessGuideFilterInput = {},
): AccessGuide[] {
  const query = input.query?.trim().toLowerCase() ?? "";
  return accessGuides.filter((guide) => {
    if (input.state && guide.state !== input.state) return false;
    if (input.tier && guide.priorityTier !== input.tier) return false;
    if (input.status && guide.statusKey !== input.status) return false;
    if (!query) return true;
    const haystack = [
      guide.title,
      guide.city,
      guide.cityOrTown,
      guide.state,
      guide.summary,
      guide.guideType,
      guide.tier,
      guide.status,
      ...guide.keyAccessThemes,
      ...guide.mappingMissions,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });
}

export function getAccessGuideStates(): string[] {
  return [...new Set(accessGuides.map((g) => g.state))].sort();
}

export function getAccessGuideTiers(): string[] {
  return [...new Set(accessGuides.map((g) => g.priorityTier))];
}

export function formatAccessGuideStatusKey(
  statusKey: AccessGuideStatusKey,
): string {
  switch (statusKey) {
    case "drafted":
      return "Drafted";
    case "needs_verification":
      return "Needs local verification";
    case "planned":
      return "Planned";
    case "partner_supplied":
      return "Partner supplied";
    case "community_reported":
      return "Community reported";
    default: {
      const _exhaustive: never = statusKey;
      return _exhaustive;
    }
  }
}

export function getAccessGuideMarkerKind(guide: AccessGuide): {
  kind: "capital" | "tier1" | "tier2" | "tier3";
  label: string;
  needsVerification: boolean;
} {
  const needsVerification = guide.statusKey === "needs_verification";
  if (guide.priorityTier === "Capital launch") {
    return { kind: "capital", label: "C", needsVerification };
  }
  if (guide.priorityTier === "Tier 1") {
    return { kind: "tier1", label: "T1", needsVerification };
  }
  if (guide.priorityTier === "Tier 2") {
    return { kind: "tier2", label: "T2", needsVerification };
  }
  return { kind: "tier3", label: "T3", needsVerification };
}
