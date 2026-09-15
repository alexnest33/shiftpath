create type public.schedule_type as enum (
  '2_2',
  '3_3',
  '2_2_3',
  'custom'
);

create type public.goal_status as enum (
  'active',
  'completed',
  'archived'
);

create type public.study_session_status as enum (
  'planned',
  'completed',
  'cancelled'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length_check
    check (display_name is null or char_length(trim(display_name)) between 1 and 100),
  constraint profiles_timezone_not_blank_check
    check (char_length(trim(timezone)) > 0)
);

create table public.schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  schedule_type public.schedule_type not null,
  starts_on date not null,
  cycle_pattern boolean[] not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint schedules_name_not_blank_check
    check (char_length(trim(name)) between 1 and 100),
  constraint schedules_cycle_pattern_length_check
    check (cardinality(cycle_pattern) between 1 and 366),
  constraint schedules_cycle_pattern_dimensions_check
    check (array_ndims(cycle_pattern) = 1),
  constraint schedules_cycle_pattern_no_nulls_check
    check (array_position(cycle_pattern, null) is null),
  constraint schedules_preset_pattern_check
    check (
      (schedule_type = '2_2' and cycle_pattern = array[true, true, false, false])
      or (schedule_type = '3_3' and cycle_pattern = array[true, true, true, false, false, false])
      or (
        schedule_type = '2_2_3'
        and cycle_pattern = array[
          true, true, false, false, true, true, true,
          false, false, true, true, false, false, false
        ]
      )
      or schedule_type = 'custom'
    )
);

comment on column public.schedules.cycle_pattern is
  'Repeating one-dimensional cycle where true is a work day and false is a day off; starts_on corresponds to the first element.';

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  status public.goal_status not null default 'active',
  target_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint goals_title_not_blank_check
    check (char_length(trim(title)) between 1 and 200),
  constraint goals_id_user_id_key unique (id, user_id)
);

create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  goal_id uuid not null,
  starts_at timestamptz not null,
  duration_minutes integer not null,
  status public.study_session_status not null default 'planned',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint study_sessions_duration_minutes_check
    check (duration_minutes between 1 and 1440),
  constraint study_sessions_goal_owner_fkey
    foreign key (goal_id, user_id)
    references public.goals (id, user_id)
    on delete cascade
);

create index schedules_user_id_starts_on_idx
  on public.schedules (user_id, starts_on);

create unique index schedules_one_active_per_user_idx
  on public.schedules (user_id)
  where is_active;

create index goals_user_id_status_idx
  on public.goals (user_id, status);

create index goals_user_id_target_date_idx
  on public.goals (user_id, target_date)
  where target_date is not null;

create index study_sessions_user_id_starts_at_idx
  on public.study_sessions (user_id, starts_at);

create index study_sessions_goal_id_starts_at_idx
  on public.study_sessions (goal_id, starts_at);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger schedules_set_updated_at
before update on public.schedules
for each row execute function public.set_updated_at();

create trigger goals_set_updated_at
before update on public.goals
for each row execute function public.set_updated_at();

create trigger study_sessions_set_updated_at
before update on public.study_sessions
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.schedules enable row level security;
alter table public.goals enable row level security;
alter table public.study_sessions enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.schedules from anon, authenticated;
revoke all on table public.goals from anon, authenticated;
revoke all on table public.study_sessions from anon, authenticated;

grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.schedules to authenticated;
grant select, insert, update, delete on table public.goals to authenticated;
grant select, insert, update, delete on table public.study_sessions to authenticated;

create policy "Users can read their own profile"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

create policy "Users can insert their own profile"
on public.profiles for insert
to authenticated
with check ((select auth.uid()) = id);

create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Users can delete their own profile"
on public.profiles for delete
to authenticated
using ((select auth.uid()) = id);

create policy "Users can read their own schedules"
on public.schedules for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert their own schedules"
on public.schedules for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own schedules"
on public.schedules for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own schedules"
on public.schedules for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can read their own goals"
on public.goals for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert their own goals"
on public.goals for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own goals"
on public.goals for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own goals"
on public.goals for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can read their own study sessions"
on public.study_sessions for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert their own study sessions"
on public.study_sessions for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own study sessions"
on public.study_sessions for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own study sessions"
on public.study_sessions for delete
to authenticated
using ((select auth.uid()) = user_id);
