-- GastoTrack Database Schema
-- No auth — single-user personal app

create table expenses (
  id uuid default gen_random_uuid() primary key,
  amount numeric(10,2) not null,
  category text not null,
  note text,
  created_at timestamptz default now(),
  date date not null default (now() at time zone 'Asia/Manila')::date
);

create table categories (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  emoji text not null,
  sort_order int default 0,
  is_active boolean default true
);

create table notification_prefs (
  id uuid default gen_random_uuid() primary key,
  enabled boolean default true,
  start_hour int default 8,
  end_hour int default 20,
  interval_hours int default 2
);

create table budget_goals (
  id uuid default gen_random_uuid() primary key,
  daily_limit numeric(10,2),
  weekly_limit numeric(10,2),
  monthly_limit numeric(10,2)
);

-- Indexes
create index idx_expenses_date on expenses(date);
create index idx_expenses_category on expenses(category);
create index idx_categories_active on categories(is_active) where is_active = true;
