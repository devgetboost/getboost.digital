
-- Add optional client info fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS company text,
  ADD COLUMN IF NOT EXISTS notes text;

-- Allow admins to update/insert any profile (for editing client data)
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert any profile" ON public.profiles;
CREATE POLICY "Admins can insert any profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to upload/manage avatars for any client
DROP POLICY IF EXISTS "Admins can upload any avatar" ON storage.objects;
CREATE POLICY "Admins can upload any avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update any avatar" ON storage.objects;
CREATE POLICY "Admins can update any avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete any avatar" ON storage.objects;
CREATE POLICY "Admins can delete any avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND public.has_role(auth.uid(), 'admin'));
