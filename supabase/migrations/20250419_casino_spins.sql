
create table casino_spins (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  outcome_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index for faster lookups
create index casino_spins_user_id_idx on casino_spins(user_id);

-- Add RLS policies
alter table casino_spins enable row level security;

create policy "Users can view their own spins"
  on casino_spins for select
  using (auth.uid() = user_id);

create policy "Users can insert their own spins"
  on casino_spins for insert
  with check (auth.uid() = user_id);
