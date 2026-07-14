
CREATE TABLE public.booking_settings (
  id integer PRIMARY KEY DEFAULT 1,
  available_days integer[] NOT NULL DEFAULT '{1,2,3,4,5}',
  available_times text[] NOT NULL DEFAULT '{"09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00"}',
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

ALTER TABLE public.booking_settings ENABLE ROW LEVEL SECURITY;

INSERT INTO public.booking_settings (id) VALUES (1);

CREATE POLICY "Anyone can read booking settings" ON public.booking_settings
  FOR SELECT TO public USING (true);

CREATE POLICY "Admins can update booking settings" ON public.booking_settings
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
