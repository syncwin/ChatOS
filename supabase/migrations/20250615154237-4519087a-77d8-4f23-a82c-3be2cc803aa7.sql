
-- Create a new bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Set up RLS policies for the avatars bucket
-- Allow public read access to avatars
CREATE POLICY "Avatar images are publicly accessible."
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Anyone can upload an avatar."
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- Allow users to update their own avatar
CREATE POLICY "Anyone can update their own avatar."
ON storage.objects FOR UPDATE
USING ( auth.uid() = owner AND bucket_id = 'avatars' );

-- Allow users to delete their own avatar
CREATE POLICY "Anyone can delete their own avatar."
ON storage.objects FOR DELETE
USING ( auth.uid() = owner AND bucket_id = 'avatars' );
