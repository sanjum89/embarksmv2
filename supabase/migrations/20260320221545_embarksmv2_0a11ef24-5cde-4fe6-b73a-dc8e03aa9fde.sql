INSERT INTO storage.buckets (id, name, public) VALUES ('embarksmv2-logos', 'embarksmv2-logos', true);

CREATE POLICY "Anyone can upload logos" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'embarksmv2-logos');
CREATE POLICY "Anyone can read logos" ON storage.objects FOR SELECT TO public USING (bucket_id = 'embarksmv2-logos');
CREATE POLICY "Anyone can update logos" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'embarksmv2-logos');
CREATE POLICY "Anyone can delete logos" ON storage.objects FOR DELETE TO public USING (bucket_id = 'embarksmv2-logos');