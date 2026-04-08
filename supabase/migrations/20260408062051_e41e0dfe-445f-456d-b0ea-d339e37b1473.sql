INSERT INTO storage.buckets (id, name, public)
VALUES ('podcast-audio', 'podcast-audio', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read podcast audio"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'podcast-audio');