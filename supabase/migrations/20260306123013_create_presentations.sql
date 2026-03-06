-- Presentations table
create table presentations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  brief jsonb not null default '{}',
  brand jsonb not null default '{}',
  slides jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table presentations enable row level security;

-- Public read/write for now (no auth yet)
create policy "Public read" on presentations for select using (true);
create policy "Public insert" on presentations for insert with check (true);
create policy "Public update" on presentations for update using (true);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on presentations
  for each row
  execute function update_updated_at();
