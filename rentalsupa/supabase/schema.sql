-- RentDesk database schema
-- Run this once in Supabase → SQL Editor → New query → Run.
-- Safe to re-run: uses "if not exists" so it won't error on a second run.

create table if not exists products (
  id text primary key,
  name text not null,
  daily_rent numeric not null default 0
);

create table if not exists machines (
  id text primary key,
  product text not null,
  number text not null,
  status text not null default 'available'
);

create table if not exists customers (
  id text primary key,
  name text not null,
  mobile text,
  address text,
  id_front boolean default false,
  id_back boolean default false,
  notes text default '',
  outstanding numeric not null default 0,
  credit_balance numeric not null default 0,
  joined_on date default current_date
);

-- items (with each item's segment history) are stored as one JSON blob per
-- order — this mirrors exactly how the app already models an order, so no
-- app logic has to change to read/write it.
create table if not exists orders (
  id text primary key,
  customer_id text references customers(id),
  advance numeric not null default 0,
  extra_expense numeric not null default 0,
  remarks text default '',
  created_on date default current_date,
  items jsonb not null default '[]'
);

create table if not exists payments (
  id text primary key,
  rental_order_id text,
  product_id text,
  amount numeric not null default 0,
  date date default current_date,
  notes text default ''
);

create table if not exists discounts (
  id text primary key,
  rental_order_id text,
  customer_id text,
  amount numeric not null default 0,
  date date default current_date,
  notes text default ''
);

create table if not exists maintenance (
  id text primary key,
  machine_id text,
  issue text,
  reported_on date default current_date,
  status text not null default 'open'
);

-- ---- Security ----
-- Row Level Security is turned on for every table, and the only policy
-- granted is "any logged-in (authenticated) user can read/write everything."
-- That means: no login → no access at all (not even read), and anyone who
-- can sign in (accounts you create yourself in Authentication → Users) can
-- fully use the app. There's no public sign-up page, so the only way in is
-- an account you create.

alter table products enable row level security;
alter table machines enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;
alter table payments enable row level security;
alter table discounts enable row level security;
alter table maintenance enable row level security;

do $$
declare
  t text;
begin
  for t in select unnest(array['products','machines','customers','orders','payments','discounts','maintenance'])
  loop
    execute format(
      'drop policy if exists "authenticated full access" on %I; create policy "authenticated full access" on %I for all to authenticated using (true) with check (true);',
      t, t
    );
  end loop;
end $$;
