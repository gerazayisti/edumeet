-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Enum Types
do $$ begin
    if not exists (select 1 from pg_type where typname = 'user_role') then
        create type user_role as enum ('admin', 'instructor', 'student', 'guest');
    end if;
    
    if not exists (select 1 from pg_type where typname = 'course_status') then
        create type course_status as enum ('draft', 'active', 'archived');
    end if;
    
    if not exists (select 1 from pg_type where typname = 'enrollment_status') then
        create type enrollment_status as enum ('enrolled', 'completed', 'dropped');
    end if;
    
    if not exists (select 1 from pg_type where typname = 'assignment_type') then
        create type assignment_type as enum ('quiz', 'homework', 'project', 'exam');
    end if;
    
    if not exists (select 1 from pg_type where typname = 'assignment_status') then
        create type assignment_status as enum ('draft', 'published', 'closed');
    end if;
    
    if not exists (select 1 from pg_type where typname = 'meeting_type') then
        create type meeting_type as enum ('class', 'office_hours', 'group_study', 'consultation');
    end if;
    
    if not exists (select 1 from pg_type where typname = 'meeting_status') then
        create type meeting_status as enum ('scheduled', 'in_progress', 'completed', 'cancelled');
    end if;
    
    if not exists (select 1 from pg_type where typname = 'notification_type') then
        create type notification_type as enum ('info', 'achievement', 'warning', 'error', 'system');
    end if;
    
    if not exists (select 1 from pg_type where typname = 'meeting_participant_status') then
        create type meeting_participant_status as enum ('invited', 'accepted', 'declined', 'attended');
    end if;
    
    if not exists (select 1 from pg_type where typname = 'meeting_reaction_type') then
        create type meeting_reaction_type as enum ('hand', 'like', 'heart', 'clap', 'smile');
    end if;
    
    if not exists (select 1 from pg_type where typname = 'badge_category') then
        create type badge_category as enum ('academic', 'participation', 'progress', 'special');
    end if;
end $$;

-- Enhanced Profiles Table
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
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  phone_number text,
  timezone text default 'UTC'
);

-- Courses Table with Enhanced Fields
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
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  is_featured boolean default false,
  prerequisites uuid[] default array[]::uuid[]
);

-- Course Enrollments with Additional Tracking
create table if not exists public.course_enrollments (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  student_id uuid references public.profiles(id) on delete cascade not null,
  status enrollment_status default 'enrolled',
  grade text,
  grade_points numeric(3,2),
  enrolled_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone,
  last_activity_at timestamp with time zone,
  progress_percentage numeric(5,2) default 0,
  unique(course_id, student_id)
);

-- Assignments with Comprehensive Details
create table if not exists public.assignments (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null,
  description text,
  due_date timestamp with time zone not null,
  max_score integer not null,
  type assignment_type not null,
  status assignment_status default 'draft',
  instructions text,
  resources text[],
  weight numeric(5,2) default 1.0,
  created_by uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  allow_late_submission boolean default false,
  late_penalty_percentage numeric(5,2) default 0
);

-- Assignment Submissions with Enhanced Tracking
create table if not exists public.assignment_submissions (
  id uuid default uuid_generate_v4() primary key,
  assignment_id uuid references public.assignments(id) on delete cascade not null,
  student_id uuid references public.profiles(id) on delete cascade not null,
  content text,
  file_urls text[],
  score numeric(5,2),
  max_score numeric(5,2),
  feedback text,
  status text check (status in ('draft', 'submitted', 'graded', 'returned')) default 'draft',
  submitted_at timestamp with time zone,
  graded_at timestamp with time zone,
  graded_by uuid references public.profiles(id),
  plagiarism_score numeric(3,2),
  submission_attempts integer default 1,
  late_penalty_applied numeric(5,2) default 0,
  unique(assignment_id, student_id)
);

-- Meetings with Enhanced Metadata
create table if not exists public.meetings (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references public.courses(id) on delete cascade,
  title text not null,
  description text,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  host_id uuid references public.profiles(id) not null,
  meeting_code text unique not null,
  meeting_link text,
  type meeting_type not null,
  status meeting_status default 'scheduled',
  recording_url text,
  max_participants integer default 100,
  is_recurring boolean default false,
  recurring_pattern text,
  is_private boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Meeting Participants with Detailed Tracking
create table if not exists public.meeting_participants (
  id uuid default uuid_generate_v4() primary key,
  meeting_id uuid references public.meetings(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  status meeting_participant_status default 'invited',
  joined_at timestamp with time zone,
  left_at timestamp with time zone,
  participation_duration interval,
  device_info jsonb,
  connection_quality text,
  unique(meeting_id, user_id)
);

-- Meeting Reactions with Expanded Types
create table if not exists public.meeting_reactions (
  id uuid default uuid_generate_v4() primary key,
  meeting_id uuid references public.meetings(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type meeting_reaction_type not null,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Comprehensive Notifications System
create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  sender_id uuid references public.profiles(id),
  title text not null,
  message text not null,
  type notification_type not null,
  reference_id uuid,
  reference_type text,
  priority text check (priority in ('low', 'medium', 'high')) default 'medium',
  read boolean default false,
  read_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Achievements System Tables
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

-- Function to check if a column exists
create or replace function column_exists(ptable text, pcolumn text) returns boolean as $$
begin
    return exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
        and table_name = ptable
        and column_name = pcolumn
    );
end;
$$ language plpgsql;

-- Add new columns if they don't exist
do $$ 
begin
    -- Profiles table new columns
    if not column_exists('profiles', 'phone_number') then
        alter table public.profiles add column phone_number text;
    end if;
    
    if not column_exists('profiles', 'timezone') then
        alter table public.profiles add column timezone text default 'UTC';
    end if;

    -- Courses table new columns
    if not column_exists('courses', 'is_featured') then
        alter table public.courses add column is_featured boolean default false;
    end if;
    
    if not column_exists('courses', 'prerequisites') then
        alter table public.courses add column prerequisites uuid[] default array[]::uuid[];
    end if;

    -- Meetings table new columns
    if not column_exists('meetings', 'recording_url') then
        alter table public.meetings add column recording_url text;
    end if;
    
    if not column_exists('meetings', 'max_participants') then
        alter table public.meetings add column max_participants integer default 100;
    end if;
    
    if not column_exists('meetings', 'is_private') then
        alter table public.meetings add column is_private boolean default false;
    end if;

    -- Meeting participants table new columns
    if not column_exists('meeting_participants', 'device_info') then
        alter table public.meeting_participants add column device_info jsonb;
    end if;
    
    if not column_exists('meeting_participants', 'connection_quality') then
        alter table public.meeting_participants add column connection_quality text;
    end if;

    -- Assignments table new columns
    if not column_exists('assignments', 'allow_late_submission') then
        alter table public.assignments add column allow_late_submission boolean default false;
    end if;
    
    if not column_exists('assignments', 'late_penalty_percentage') then
        alter table public.assignments add column late_penalty_percentage numeric(5,2) default 0;
    end if;

    -- Assignment submissions table new columns
    if not column_exists('assignment_submissions', 'submission_attempts') then
        alter table public.assignment_submissions add column submission_attempts integer default 1;
    end if;
    
    if not column_exists('assignment_submissions', 'late_penalty_applied') then
        alter table public.assignment_submissions add column late_penalty_applied numeric(5,2) default 0;
    end if;

    -- Course enrollments table new columns
    if not column_exists('course_enrollments', 'last_activity_at') then
        alter table public.course_enrollments add column last_activity_at timestamp with time zone;
    end if;
    
    if not column_exists('course_enrollments', 'progress_percentage') then
        alter table public.course_enrollments add column progress_percentage numeric(5,2) default 0;
    end if;

end $$;

-- Achievement Functions
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

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.course_enrollments enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_submissions enable row level security;
alter table public.meetings enable row level security;
alter table public.meeting_participants enable row level security;
alter table public.meeting_reactions enable row level security;
alter table public.notifications enable row level security;
alter table public.badges enable row level security;
alter table public.achievements enable row level security;
alter table public.rewards enable row level security;
alter table public.user_rewards enable row level security;

-- RLS Policies for Profiles
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- RLS Policies for Courses
create policy "Instructors can manage their courses"
  on public.courses for all
  using (auth.uid() = instructor_id);

create policy "Students can view active courses"
  on public.courses for select
  using (status = 'active');

-- RLS Policies for Course Enrollments
create policy "Students can view their enrollments"
  on public.course_enrollments for select
  using (auth.uid() = student_id);

create policy "Instructors can manage course enrollments"
  on public.course_enrollments for all
  using (
    exists (
      select 1 from public.courses 
      where courses.id = course_enrollments.course_id 
      and courses.instructor_id = auth.uid()
    )
  );

-- RLS Policies for Assignments
create policy "Instructors can manage course assignments"
  on public.assignments for all
  using (
    exists (
      select 1 from public.courses 
      where courses.id = assignments.course_id 
      and courses.instructor_id = auth.uid()
    )
  );

create policy "Students can view published assignments in enrolled courses"
  on public.assignments for select
  using (
    status = 'published' and 
    exists (
      select 1 from public.course_enrollments 
      where course_enrollments.course_id = assignments.course_id 
      and course_enrollments.student_id = auth.uid()
    )
  );

-- RLS Policies for Assignment Submissions
create policy "Students can submit to their assignments"
  on public.assignment_submissions for insert
  with check (
    auth.uid() = student_id and 
    exists (
      select 1 from public.course_enrollments 
      where course_enrollments.course_id = (
        select course_id from public.assignments 
        where assignments.id = assignment_submissions.assignment_id
      ) 
      and course_enrollments.student_id = auth.uid()
    )
  );

create policy "Instructors can grade submissions in their courses"
  on public.assignment_submissions for update
  using (
    exists (
      select 1 from public.courses 
      join public.assignments on assignments.course_id = courses.id
      where courses.instructor_id = auth.uid() 
      and assignments.id = assignment_submissions.assignment_id
    )
  );

-- RLS Policies for Meetings
create policy "Instructors can manage their meetings"
  on public.meetings for all
  using (auth.uid() = host_id);

create policy "Participants can view meeting details"
  on public.meetings for select
  using (
    exists (
      select 1 from public.meeting_participants 
      where meeting_participants.meeting_id = meetings.id 
      and meeting_participants.user_id = auth.uid()
    )
  );

-- RLS Policies for Meeting Participants
create policy "Users can join meetings they're invited to"
  on public.meeting_participants for all
  using (auth.uid() = user_id);

-- RLS Policies for Meeting Reactions
create policy "Users can react in meetings they participate in"
  on public.meeting_reactions for all
  using (
    exists (
      select 1 from public.meeting_participants 
      where meeting_participants.meeting_id = meeting_reactions.meeting_id 
      and meeting_participants.user_id = auth.uid()
    )
  );

-- RLS Policies for Notifications
create policy "Users can view their own notifications"
  on public.notifications for all
  using (auth.uid() = user_id);

-- RLS Policies for Achievements System
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

-- Trigger Functions and Triggers
create or replace function handle_new_notification()
returns trigger as $$
begin
  perform pg_notify(
    'new_notification',
    json_build_object(
      'user_id', NEW.user_id,
      'title', NEW.title,
      'message', NEW.message,
      'type', NEW.type,
      'priority', NEW.priority
    )::text
  );
  return NEW;
end;
$$ language plpgsql;

create trigger on_new_notification
  after insert on public.notifications
  for each row
  execute function handle_new_notification();

-- Real-time subscriptions
create publication supabase_realtime for all tables;
