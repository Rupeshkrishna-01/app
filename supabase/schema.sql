-- ==========================================================
-- COLLEGE ATTENDANCE TRACKER - DATABASE SCHEMA & RLS POLICIES
-- ==========================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USER PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.user_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    attendance_threshold NUMERIC(5,2) DEFAULT 75.00 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TIMETABLES TABLE
CREATE TABLE IF NOT EXISTS public.timetables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 1=Monday ... 6=Saturday
    period_label TEXT, -- e.g. "Period 1", "Lab Block"
    subject_name TEXT NOT NULL,
    subject_color TEXT DEFAULT '#3b82f6' NOT NULL, -- Subject tag color hex/hsl
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ATTENDANCE LOGS TABLE
CREATE TABLE IF NOT EXISTS public.attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    timetable_entry_id UUID NOT NULL REFERENCES public.timetables(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'cancelled')),
    logged_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_timetable_date UNIQUE(user_id, timetable_entry_id, date)
);

-- 4. PUSH SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription JSONB NOT NULL,
    device_info TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_subscription UNIQUE(user_id, subscription)
);

-- ==========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- user_profiles Policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
CREATE POLICY "Users can read own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own profile" ON public.user_profiles;
CREATE POLICY "Users can delete own profile" ON public.user_profiles FOR DELETE USING (auth.uid() = user_id);

-- timetables Policies
DROP POLICY IF EXISTS "Users can read own timetables" ON public.timetables;
CREATE POLICY "Users can read own timetables" ON public.timetables FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own timetables" ON public.timetables;
CREATE POLICY "Users can insert own timetables" ON public.timetables FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own timetables" ON public.timetables;
CREATE POLICY "Users can update own timetables" ON public.timetables FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own timetables" ON public.timetables;
CREATE POLICY "Users can delete own timetables" ON public.timetables FOR DELETE USING (auth.uid() = user_id);

-- attendance_logs Policies
DROP POLICY IF EXISTS "Users can read own attendance_logs" ON public.attendance_logs;
CREATE POLICY "Users can read own attendance_logs" ON public.attendance_logs FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own attendance_logs" ON public.attendance_logs;
CREATE POLICY "Users can insert own attendance_logs" ON public.attendance_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own attendance_logs" ON public.attendance_logs;
CREATE POLICY "Users can update own attendance_logs" ON public.attendance_logs FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own attendance_logs" ON public.attendance_logs;
CREATE POLICY "Users can delete own attendance_logs" ON public.attendance_logs FOR DELETE USING (auth.uid() = user_id);

-- push_subscriptions Policies
DROP POLICY IF EXISTS "Users can read own push_subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can read own push_subscriptions" ON public.push_subscriptions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own push_subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can insert own push_subscriptions" ON public.push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own push_subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can update own push_subscriptions" ON public.push_subscriptions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own push_subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can delete own push_subscriptions" ON public.push_subscriptions FOR DELETE USING (auth.uid() = user_id);

-- Automatic Profile Creation Trigger on Sign-Up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (user_id, attendance_threshold)
    VALUES (NEW.id, 75.00)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
