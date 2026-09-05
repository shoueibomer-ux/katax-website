-- ============================================
-- KATAX Supabase setup
-- Run this once in Supabase: SQL Editor -> New query -> paste -> Run
-- ============================================

create table if not exists site_content (
  id int primary key,
  data jsonb not null
);

create table if not exists contacts (
  id text primary key,
  name text not null,
  email text not null,
  phone text,
  service text,
  message text not null,
  received_at timestamptz not null default now(),
  ip text
);

create table if not exists clients (
  id text primary key,
  name text not null,
  phone text,
  email text,
  service text,
  status text not null default 'Lead',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz
);

-- Seed the site content with what's currently on the live site
insert into site_content (id, data)
values (1, '{"hero": {"eyebrow": "TORONTO \u00b7 PERSONAL & BUSINESS TAX", "headline": "Your taxes, filed right, by someone who picks up the phone.", "subtext": "Kaya for Accounting & Tax Services Inc. handles personal, self-employment, business and corporate returns, GST/HST filing, and year-round bookkeeping \u2014 with one person accountable for your file from intake to e-file confirmation."}, "contact": {"phone": "437-230-5860", "email": "info@katax.ca", "addressLine": "Toronto, ON M1E 4Y2"}, "services": [{"code": "T1", "title": "Personal income tax returns", "description": "E-filed personal returns, prepared and reviewed before they''re sent."}, {"code": "T2125", "title": "Self-employment tax returns", "description": "Business-use-of-home, vehicle expenses, and income reporting done properly."}, {"code": "T2", "title": "Business income tax returns", "description": "Corporate returns prepared alongside your bookkeeping, not disconnected from it."}, {"code": "GL", "title": "Complete accounting & bookkeeping", "description": "Monthly or quarterly books kept current, reconciled, and ready for tax time."}, {"code": "GST34", "title": "GST/HST returns", "description": "Registration, filing, and reconciliation for GST/HST-registered businesses."}]}'::jsonb)
on conflict (id) do nothing;
