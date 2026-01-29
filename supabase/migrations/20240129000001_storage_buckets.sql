-- Create Storage Buckets
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true);

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false);

-- RLS for Storage
-- Avatars: Public read, Authenticated upload (own folder)
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Anyone can upload an avatar"
  on storage.objects for insert
  with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

create policy "Users can update their own avatar"
  on storage.objects for update
  using ( auth.uid() = owner )
  with check ( bucket_id = 'avatars' );

-- Documents: Private, restricted to employees/managers
create policy "Authenticated users can upload documents"
  on storage.objects for insert
  with check ( bucket_id = 'documents' and auth.role() = 'authenticated' );

create policy "Users can view their own documents"
  on storage.objects for select
  using ( bucket_id = 'documents' and auth.uid() = owner );
