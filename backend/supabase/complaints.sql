create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  description text not null check (char_length(description) > 0),
  category text not null check (category in ('Product', 'Packaging', 'Trade', 'Invalid')),
  priority text not null check (priority in ('High', 'Medium', 'Low')),
  recommendation text[],
  status text not null default 'OPEN' check (status in ('OPEN', 'PENDING', 'REVIEWED', 'ESCALATED', 'CLOSED')),
  sla_deadline timestamptz,
  created_at timestamptz not null default now()
);

alter table public.complaints enable row level security;

-- Customers: full access to their own complaints
create policy "Users can create their complaints"
on public.complaints
for insert
with check (auth.uid() = user_id);

create policy "Users can view their complaints"
on public.complaints
for select
using (auth.uid() = user_id);

create policy "Users can update their complaints"
on public.complaints
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their complaints"
on public.complaints
for delete
using (auth.uid() = user_id);

-- Operators and admins: read and update all complaints
create policy "Operators can view all complaints"
on public.complaints
for select
using (
  exists (
    select 1 from public.users
    where id = auth.uid()
    and role in ('operator', 'admin')
  )
);

create policy "Operators can update all complaints"
on public.complaints
for update
using (
  exists (
    select 1 from public.users
    where id = auth.uid()
    and role in ('operator', 'admin')
  )
);

create index if not exists complaints_user_id_idx on public.complaints (user_id);
create index if not exists complaints_status_idx on public.complaints (status);
create index if not exists complaints_sla_deadline_idx on public.complaints (sla_deadline);
create index if not exists complaints_created_at_idx on public.complaints (created_at desc);

grant select, insert, update, delete on table public.complaints to authenticated;
grant all on table public.complaints to service_role;
