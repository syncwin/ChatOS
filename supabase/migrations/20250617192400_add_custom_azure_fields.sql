ALTER TABLE public.api_keys
ADD COLUMN endpoint_url TEXT NULL,
ADD COLUMN deployment_id TEXT NULL;
