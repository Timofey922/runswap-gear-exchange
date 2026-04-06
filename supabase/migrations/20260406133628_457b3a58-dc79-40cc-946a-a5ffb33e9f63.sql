
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-images', 'listing-images', true);

CREATE POLICY "Anyone can view listing images"
ON storage.objects FOR SELECT
USING (bucket_id = 'listing-images');

CREATE POLICY "Anyone can upload listing images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'listing-images');
