-- 1. Create profiles table
create table public.profiles (
  id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  nombre text,
  idioma text default 'es'::text check (idioma in ('es', 'en')),
  ciudad text default 'Alicante,ES'::text,
  genero text default 'hombre'::text check (genero in ('hombre', 'mujer')),
  stripe_customer_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

-- 2. Enable RLS on profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true ); -- Or restrict to authenticated users if preferred

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- 3. Create subscriptions table
create table public.subscriptions (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  stripe_subscription_id text,
  status text not null check (status in ('trialing', 'active', 'canceled', 'past_due', 'expired')),
  plan text not null check (plan in ('monthly', 'yearly')),
  trial_start timestamp with time zone,
  trial_end timestamp with time zone,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

-- 4. Enable RLS on subscriptions
alter table public.subscriptions enable row level security;

create policy "Users can view own subscription."
  on subscriptions for select
  using ( auth.uid() = user_id );

-- 5. Trigger to handle new user registration
-- This function creates a profile entry automatically when a new user signs up via Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

-- Trigger execution
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. Storage Buckets (Optional: run if buckets don't exist)
-- insert into storage.buckets (id, name, public) values ('wardrobe-photos', 'wardrobe-photos', true);
-- insert into storage.buckets (id, name, public) values ('user-photos', 'user-photos', true);
-- insert into storage.buckets (id, name, public) values ('outfit-images', 'outfit-images', true);
