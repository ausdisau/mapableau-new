-- Provider Finder classification fields on NDIS provider_outlets.

ALTER TABLE public.provider_outlets
  ADD COLUMN IF NOT EXISTS support_types TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS access_need_ids TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS provider_outlets_support_types_idx
  ON public.provider_outlets USING GIN (support_types);

CREATE INDEX IF NOT EXISTS provider_outlets_access_need_ids_idx
  ON public.provider_outlets USING GIN (access_need_ids);
