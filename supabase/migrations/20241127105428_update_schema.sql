
-- Drop existing types if they exist
drop type if exists user_role cascade;
drop type if exists course_status cascade;
drop type if exists enrollment_status cascade;
drop type if exists assignment_type cascade;
drop type if exists assignment_status cascade;
drop type if exists meeting_type cascade;
drop type if exists meeting_status cascade;
drop type if exists notification_type cascade;
drop type if exists meeting_participant_status cascade;
drop type if exists meeting_reaction_type cascade;
drop type if exists badge_category cascade;

-- Create updated enum types
create type user_role as enum ('admin', 'instructor', 'student', 'guest');
create type course_status as enum ('draft', 'active', 'archived');
create type enrollment_status as enum ('enrolled', 'completed', 'dropped');
create type assignment_type as enum ('quiz', 'homework', 'project', 'exam');
create type assignment_status as enum ('draft', 'published', 'closed');
create type meeting_type as enum ('class', 'office_hours', 'group_study', 'consultation');
create type meeting_status as enum ('scheduled', 'in_progress', 'completed', 'cancelled');
create type notification_type as enum ('info', 'achievement', 'warning', 'error', 'system');
create type meeting_participant_status as enum ('invited', 'accepted', 'declined', 'attended');
create type meeting_reaction_type as enum ('hand', 'like', 'heart', 'clap', 'smile');
create type badge_category as enum ('academic', 'participation', 'progress', 'special');

-- Create or update tables
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text not null,
  avatar_url text,
  role user_role not null default 'student',
  department text,
  bio text,
  last_login timestamp with time zone,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.courses (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  code text unique not null,
  department text,
  credits integer,
  instructor_id uuid references public.profiles(id) not null,
  start_date timestamp with time zone not null,
  end_date timestamp with time zone not null,
  max_students integer default 30,
  status course_status default 'draft',
  syllabus_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.course_enrollments (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  student_id uuid references public.profiles(id) on delete cascade not null,
  status enrollment_status default 'enrolled',
  grade text,
  grade_points numeric(3,2),
  enrolled_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone,
  unique(course_id, student_id)
);

-- Create achievement system tables
create table if not exists public.badges (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    description text not null,
    icon text not null,
    category badge_category not null,
    requirements jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.achievements (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade,
    badge_id uuid references public.badges(id) on delete cascade,
    earned_at timestamp with time zone default timezone('utc'::text, now()),
    progress float default 0,
    metadata jsonb default '{}'::jsonb,
    unique(user_id, badge_id)
);

create table if not exists public.rewards (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    description text not null,
    cost integer not null check (cost >= 0),
    type text not null check (type in ('feature', 'privilege', 'item')),
    availability text not null check (availability in ('always', 'limited', 'seasonal')),
    valid_until timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists public.user_rewards (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade,
    reward_id uuid references public.rewards(id) on delete cascade,
    claimed_at timestamp with time zone default timezone('utc'::text, now()),
    unique(user_id, reward_id)
);

-- Create or replace functions
create or replace function calculate_user_points(p_user_id uuid)
returns integer as $$
declare
    total_points integer;
begin
    select count(*) * 100
    into total_points
    from achievements
    where user_id = p_user_id;
    
    return coalesce(total_points, 0);
end;
$$ language plpgsql security definer;

create or replace function check_achievements(p_user_id uuid)
returns setof achievements as $$
declare
    badge_record record;
    new_achievement achievements%rowtype;
    user_stats jsonb;
begin
    select jsonb_build_object(
        'assignments_completed', (select count(*) from assignments where user_id = p_user_id),
        'attendance_rate', (select coalesce(avg(case when status = 'present' then 1 else 0 end), 0) from attendance where user_id = p_user_id),
        'participation_score', (select coalesce(avg(participation_score), 0) from course_participation where user_id = p_user_id)
    ) into user_stats;

    for badge_record in select * from badges
    loop
        continue when exists (
            select 1 from achievements 
            where user_id = p_user_id and badge_id = badge_record.id
        );

        if (
            (badge_record.requirements->>'type' = 'assignments' and 
             (user_stats->>'assignments_completed')::int >= (badge_record.requirements->>'threshold')::int)
            or
            (badge_record.requirements->>'type' = 'attendance' and 
             (user_stats->>'attendance_rate')::float >= (badge_record.requirements->>'threshold')::float)
            or
            (badge_record.requirements->>'type' = 'participation' and 
             (user_stats->>'participation_score')::float >= (badge_record.requirements->>'threshold')::float)
        ) then
            insert into achievements (user_id, badge_id, progress, metadata)
            values (p_user_id, badge_record.id, 1.0, user_stats)
            returning * into new_achievement;
            
            return next new_achievement;
        end if;
    end loop;
    
    return;
end;
$$ language plpgsql security definer;

create or replace function claim_reward(p_user_id uuid, p_reward_id uuid)
returns boolean as $$
declare
    user_points integer;
    reward_cost integer;
begin
    select calculate_user_points(p_user_id) into user_points;
    
    select cost into reward_cost
    from rewards
    where id = p_reward_id
    and (valid_until is null or valid_until > now());
    
    if reward_cost is null then
        raise exception 'Reward not found or expired';
    end if;
    
    if user_points < reward_cost then
        raise exception 'Insufficient points';
    end if;
    
    insert into user_rewards (user_id, reward_id)
    values (p_user_id, p_reward_id);
    
    return true;
exception
    when unique_violation then
        raise exception 'Reward already claimed';
    when others then
        raise exception 'Error claiming reward: %', sqlerrm;
end;
$$ language plpgsql security definer;

-- Enable RLS
alter table public.badges enable row level security;
alter table public.achievements enable row level security;
alter table public.rewards enable row level security;
alter table public.user_rewards enable row level security;

-- Create RLS policies
create policy "Anyone can view badges"
  on public.badges for select
  to authenticated
  using (true);

create policy "Users can view their own achievements"
  on public.achievements for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Anyone can view available rewards"
  on public.rewards for select
  to authenticated
  using (valid_until is null or valid_until > now());

create policy "Users can view their claimed rewards"
  on public.user_rewards for select
  to authenticated
  using (auth.uid() = user_id);