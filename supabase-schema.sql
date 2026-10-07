-- ==============================================================================
-- THE KINGDOM LEADERS (TKL) - SUPABASE DATABASE SCHEMA & CONFIGURATION
-- ==============================================================================
-- Instructions:
-- 1. Open your Supabase Project Dashboard (https://supabase.com/dashboard)
-- 2. Navigate to "SQL Editor" on the left menu.
-- 3. Click "New query", paste the entire contents of this file, and click "Run".
-- ==============================================================================

-- 1. ENABLE UUID EXTENSION
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. EVENTS TABLE
-- Stores upcoming and concluded chapter meetings, summits, and workshops
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    chapter TEXT DEFAULT 'Chennai Central Chapter',
    event_date DATE NOT NULL,
    event_time TEXT DEFAULT '05:30 PM Onwards',
    location_name TEXT NOT NULL,
    location_address TEXT,
    description TEXT,
    price NUMERIC DEFAULT 0,
    entry_type TEXT DEFAULT 'Free Entry (Dinner Included)',
    flyer_url TEXT,
    registration_url TEXT DEFAULT 'register-central.html',
    status TEXT DEFAULT 'upcoming', -- 'upcoming', 'concluded', 'draft'
    is_active BOOLEAN DEFAULT true,
    display_order INT DEFAULT 0,
    chief_guest TEXT
);

-- ==============================================================================
-- 3. REGISTRATIONS TABLE
-- Stores all member and marketplace registrations from West, Central, & custom events
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    event_name TEXT NOT NULL,
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    entry_type TEXT,
    full_name TEXT NOT NULL,
    email TEXT DEFAULT '',
    phone TEXT NOT NULL,
    pincode TEXT,
    company TEXT,
    role TEXT,
    is_existing_member TEXT DEFAULT 'No',
    referred_by TEXT,
    additional_guests INT DEFAULT 0,
    total_cost NUMERIC DEFAULT 0,
    receipt_url TEXT,
    payment_status TEXT DEFAULT 'Pending', -- 'Pending', 'Verified', 'Free', 'Rejected'
    notes TEXT
);

-- Ensure backwards-compatibility and safe deletes if table was already created
ALTER TABLE public.registrations ALTER COLUMN email DROP NOT NULL;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS chief_guest TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0;

-- Ensure foreign key does not block event deletion
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'registrations_event_id_fkey' 
        AND table_name = 'registrations'
    ) THEN
        ALTER TABLE public.registrations DROP CONSTRAINT registrations_event_id_fkey;
        ALTER TABLE public.registrations 
            ADD CONSTRAINT registrations_event_id_fkey 
            FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Indexes for lightning-fast queries in the Master Dashboard
CREATE INDEX IF NOT EXISTS idx_registrations_event_name ON public.registrations(event_name);
CREATE INDEX IF NOT EXISTS idx_registrations_email ON public.registrations(email);
CREATE INDEX IF NOT EXISTS idx_registrations_phone ON public.registrations(phone);
CREATE INDEX IF NOT EXISTS idx_registrations_payment_status ON public.registrations(payment_status);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);

-- ==============================================================================
-- 4. ROW-LEVEL SECURITY (RLS) POLICIES
-- Allows website visitors to submit registrations and view active events,
-- while giving full access for Master Portal management.
-- ==============================================================================
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- EVENTS POLICIES
DROP POLICY IF EXISTS "Public can view active events" ON public.events;
CREATE POLICY "Public can view active events" 
    ON public.events FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Allow delete events" ON public.events;
CREATE POLICY "Allow delete events" 
    ON public.events FOR DELETE 
    USING (true);

DROP POLICY IF EXISTS "Allow update events" ON public.events;
CREATE POLICY "Allow update events" 
    ON public.events FOR UPDATE 
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow insert events" ON public.events;
CREATE POLICY "Allow insert events" 
    ON public.events FOR INSERT 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access on events" ON public.events;
CREATE POLICY "Admin full access on events" 
    ON public.events FOR ALL 
    USING (true)
    WITH CHECK (true);

-- REGISTRATIONS POLICIES
DROP POLICY IF EXISTS "Public can insert registrations" ON public.registrations;
CREATE POLICY "Public can insert registrations" 
    ON public.registrations FOR INSERT 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete registrations" ON public.registrations;
CREATE POLICY "Allow delete registrations" 
    ON public.registrations FOR DELETE 
    USING (true);

DROP POLICY IF EXISTS "Admin view and manage registrations" ON public.registrations;
CREATE POLICY "Admin view and manage registrations" 
    ON public.registrations FOR ALL 
    USING (true)
    WITH CHECK (true);

-- ==============================================================================
-- 5. STORAGE BUCKETS FOR RECEIPTS & EVENT FLYERS
-- ==============================================================================
-- Receipts bucket for payment screenshots
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Flyers bucket for event poster uploads in Master Admin
INSERT INTO storage.buckets (id, name, public) 
VALUES ('flyers', 'flyers', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow public uploads of receipts from registration forms
DROP POLICY IF EXISTS "Public Upload Receipts" ON storage.objects;
CREATE POLICY "Public Upload Receipts" 
    ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'receipts');

-- Allow public read of receipts
DROP POLICY IF EXISTS "Public Read Receipts" ON storage.objects;
CREATE POLICY "Public Read Receipts" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'receipts');

-- Allow uploads of flyers from Master Admin
DROP POLICY IF EXISTS "Public Upload Flyers" ON storage.objects;
CREATE POLICY "Public Upload Flyers" 
    ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'flyers');

-- Allow public read of event flyers
DROP POLICY IF EXISTS "Public Read Flyers" ON storage.objects;
CREATE POLICY "Public Read Flyers" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'flyers');

-- ==============================================================================
-- 6. SEED INITIAL EVENTS
-- Matches current TKL West Chapter & Central Chapter meeting details
-- ==============================================================================
INSERT INTO public.events (
    title, subtitle, chapter, event_date, event_time, 
    location_name, location_address, description, 
    price, entry_type, flyer_url, registration_url, status, is_active, chief_guest
) VALUES 
(
    'Grand Launch: West Chapter',
    'Free Registration with Fellowship Dinner Included',
    'West Chapter',
    '2026-09-18',
    '05:30 PM Onwards',
    'Praise Evangelical Church, Mugalivakkam',
    'Praise Evangelical Church, Mugalivakkam Main Rd, Chennai - 600125',
    'The monumental Grand Launch of The Kingdom Leaders West Chapter bringing together marketplace leaders, business founders, and youth with Chief Guest Pastor K.Joshua Stephen.',
    0,
    'Free Entry (Dinner Included)',
    'images/west lanch free reg.png',
    'register-west.html',
    'concluded',
    true,
    'Pastor K.Joshua Stephen'
),
(
    'Chennai Central Chapter Meeting - 1',
    'Marketplace Fellowship & Business Networking',
    'Central Chapter',
    '2026-09-18',
    '05:30 PM Onwards',
    'Praise Evangelical Church, Mugalivakkam',
    'Praise Evangelical Church, Mugalivakkam Main Rd, Chennai - 600125',
    'Marketplace leaders and entrepreneurs gathering for business networking, dinner fellowship, and purposeful expansion with Chief Guest Pastor K.Joshua Stephen.',
    250,
    'Paid Entry ₹250 (Dinner Included)',
    'images/central chapter meeting 1.jpeg',
    'register-central.html',
    'concluded',
    true,
    'Pastor K.Joshua Stephen'
)
ON CONFLICT DO NOTHING;

-- Confirmation query
SELECT 'Database setup completed successfully! TKL events and registrations tables are ready.' as status;
