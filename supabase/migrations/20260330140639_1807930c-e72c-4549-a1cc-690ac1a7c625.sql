
-- Fix 1: Restrict public booking inserts so jitsi_room must be NULL
DROP POLICY "Anyone can create bookings" ON public.bookings;
CREATE POLICY "Anyone can create bookings"
  ON public.bookings FOR INSERT TO public
  WITH CHECK (jitsi_room IS NULL);

-- Fix 2: Allow authenticated users to read their own role
CREATE POLICY "Users can read own role"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
