create table if not exists public.suburb_access_guides (
  id text primary key,
  sal_code text,
  slug text not null,
  name text not null,
  state text not null,
  lga_names text[] default '{}',
  centroid geography(point, 4326),
  boundary_geojson_url text,
  guide_status text not null default 'draft',
  access_summary text not null,
  confidence_score integer not null default 0,
  access_themes text[] default '{}',
  transport_notes jsonb default '[]'::jsonb,
  toilet_notes jsonb default '[]'::jsonb,
  parking_dropoff_notes jsonb default '[]'::jsonb,
  step_free_route_notes jsonb default '[]'::jsonb,
  sensory_notes jsonb default '[]'::jsonb,
  venue_highlights jsonb default '[]'::jsonb,
  health_and_support_anchors jsonb default '[]'::jsonb,
  local_risks jsonb default '[]'::jsonb,
  nearby_guides text[] default '{}',
  data_sources jsonb default '[]'::jsonb,
  last_updated date not null default current_date,
  last_verified date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (state, slug)
);

create index if not exists suburb_access_guides_state_idx on public.suburb_access_guides (state);
create index if not exists suburb_access_guides_status_idx on public.suburb_access_guides (guide_status);
create index if not exists suburb_access_guides_centroid_idx on public.suburb_access_guides using gist (centroid);

create table if not exists public.suburb_access_updates (
  id uuid primary key default gen_random_uuid(),
  guide_id text references public.suburb_access_guides(id),
  update_type text not null,
  details text not null,
  email text,
  status text not null default 'pending-review',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewer_notes text
);
