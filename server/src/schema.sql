-- Farmer Market Connect — schema
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('farmer', 'buyer', 'mediator', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE listing_status AS ENUM ('available', 'reserved', 'sold');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(10) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'buyer',
  location TEXT DEFAULT '',
  avatar_color TEXT DEFAULT '#2E5E3E',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crop_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  price_per_unit NUMERIC NOT NULL,
  harvest_date DATE NOT NULL,
  location TEXT NOT NULL,
  status listing_status NOT NULL DEFAULT 'available',
  image_url TEXT NOT NULL,
  description TEXT,
  farmer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interested_count INT NOT NULL DEFAULT 0,
  posted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS buyer_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES crop_listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pesticide_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pesticide_name TEXT NOT NULL,
  crop_category TEXT NOT NULL,
  applicable_crops TEXT[] NOT NULL DEFAULT '{}',
  price_per_unit NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT 'litre',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_listings_category ON crop_listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_farmer ON crop_listings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_interests_listing ON buyer_interests(listing_id);
CREATE INDEX IF NOT EXISTS idx_pesticide_category ON pesticide_prices(crop_category);
