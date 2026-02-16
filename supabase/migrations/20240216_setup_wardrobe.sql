-- Migration: Setup Wardrobe (Phase 4)

-- 1. Create 'garments' table (Prendas)
create table if not exists public.garments (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  codigo text not null, -- Human readable ID (e.g. CAM-001)
  categoria text not null check (categoria in ('Camisa', 'Polo', 'Camiseta', 'Pantalón', 'Jersey', 'Sudadera', 'Abrigo/Chaqueta', 'Cinturón', 'Calcetines', 'Zapatos', 'Zapatillas', 'Accesorio')),
  marca text, -- 'NO VISIBLE' or user input
  talla text, -- 'NO VISIBLE' or user input
  color text not null,
  descripcion text,
  estilo text check (estilo in ('Casual', 'Smart Casual', 'Business Casual', 'Formal', 'Elegante', 'Deportivo')),
  temporada text check (temporada in ('Verano', 'Entretiempo', 'Invierno', 'Todo el año')),
  foto_url text not null,
  activa boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

-- Enable RLS for garments
alter table public.garments enable row level security;

create policy "Users can view own garments"
  on garments for select
  using ( auth.uid() = user_id );

create policy "Users can insert own garments"
  on garments for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own garments"
  on garments for update
  using ( auth.uid() = user_id );

create policy "Users can delete own garments"
  on garments for delete
  using ( auth.uid() = user_id );


-- 2. Create 'outfits' table (Historial de combinaciones)
create table if not exists public.outfits (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  fecha date not null,
  ocasion text,
  descripcion_ocasion text,
  prenda_superior_id uuid references public.garments(id) on delete set null,
  prenda_inferior_id uuid references public.garments(id) on delete set null,
  prenda_calzado_id uuid references public.garments(id) on delete set null,
  prenda_cinturon_id uuid references public.garments(id) on delete set null,
  prenda_capa_exterior_id uuid references public.garments(id) on delete set null,
  prenda_calcetines_id uuid references public.garments(id) on delete set null,
  temperatura decimal,
  condicion_clima text,
  imagen_generada_url text,
  color_palette text[],
  style_notes text,
  imagen_prompt text,
  elegido boolean default false,
  favorito boolean default false,
  origen text default 'diario' check (origen in ('diario', 'planificacion')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

-- Enable RLS for outfits
alter table public.outfits enable row level security;

create policy "Users can view own outfits"
  on outfits for select
  using ( auth.uid() = user_id );

create policy "Users can insert own outfits"
  on outfits for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own outfits"
  on outfits for update
  using ( auth.uid() = user_id );


-- 3. Create Storage Buckets
-- Note: 'insert into storage.buckets' requires specific privileges. 
-- If this fails, user might need to create buckets in Dashboard.

insert into storage.buckets (id, name, public)
values ('garment-images', 'garment-images', true)
on conflict (id) do nothing;

create policy "Garment Images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'garment-images' );

create policy "Users can upload garment images"
  on storage.objects for insert
  with check ( bucket_id = 'garment-images' and auth.uid() = (storage.foldername(name))[1]::uuid );

create policy "Users can update own garment images"
  on storage.objects for update
  using ( bucket_id = 'garment-images' and auth.uid() = (storage.foldername(name))[1]::uuid );

create policy "Users can delete own garment images"
  on storage.objects for delete
  using ( bucket_id = 'garment-images' and auth.uid() = (storage.foldername(name))[1]::uuid );
