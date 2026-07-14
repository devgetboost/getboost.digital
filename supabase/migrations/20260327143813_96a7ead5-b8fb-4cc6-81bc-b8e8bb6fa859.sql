
-- Create bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_type TEXT NOT NULL,
  meeting_date DATE NOT NULL,
  meeting_time TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  website TEXT,
  challenges TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'lisbon',
  status TEXT NOT NULL DEFAULT 'pending',
  jitsi_room TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Public can insert bookings (no auth required for booking form)
CREATE POLICY "Anyone can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (true);

-- Only authenticated users can read bookings
CREATE POLICY "Authenticated users can view bookings" ON public.bookings
  FOR SELECT TO authenticated USING (true);

-- Only authenticated users can update bookings
CREATE POLICY "Authenticated users can update bookings" ON public.bookings
  FOR UPDATE TO authenticated USING (true);

-- Only authenticated users can delete bookings
CREATE POLICY "Authenticated users can delete bookings" ON public.bookings
  FOR DELETE TO authenticated USING (true);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
