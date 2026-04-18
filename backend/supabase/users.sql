create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(name) > 0),
  email text not null unique,
  role text not null default 'user' check (char_length(role) > 0)
);

alter table public.users enable row level security;

create policy "Users can view their row"
on public.users
for select
using (auth.uid() = id);

create policy "Users can update their row"
on public.users
for update
using (auth.uid() = id)
with check (auth.uid() = id);

create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.users (id, name, email, role)
  values (
    new.id,
    new.raw_user_meta_data->>'name',
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'user')
  )
  on conflict (id) do update
    set
      name = excluded.name,
      email = excluded.email,
      role = excluded.role;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_auth_user_created();

grant select, update on table public.users to authenticated;
grant all on table public.users to service_role;
