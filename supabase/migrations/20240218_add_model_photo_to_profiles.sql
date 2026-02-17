-- Add model photo columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS model_photo_url text,
ADD COLUMN IF NOT EXISTS use_default_model boolean DEFAULT false;

-- Create storage bucket for user models if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-models', 'user-models', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for user-models bucket
create policy "Users can upload their own model photo."
on storage.objects for insert
with check ( bucket_id = 'user-models' and auth.uid()::text = (storage.foldername(name))[1] );

create policy "Users can update their own model photo."
on storage.objects for update
with check ( bucket_id = 'user-models' and auth.uid()::text = (storage.foldername(name))[1] );

create policy "Users can view their own model photo."
on storage.objects for select
using ( bucket_id = 'user-models' and auth.uid()::text = (storage.foldername(name))[1] );

create policy "Users can delete their own model photo."
on storage.objects for delete
using ( bucket_id = 'user-models' and auth.uid()::text = (storage.foldername(name))[1] );
