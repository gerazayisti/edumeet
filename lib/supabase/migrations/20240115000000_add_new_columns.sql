-- Migration: 20240115000000_add_new_columns
-- Description: Add new columns to existing tables and enhance functionality

-- Disable triggers temporarily for bulk operations
set session_replication_role = replica;

-- Create function to check column existence if it doesn't exist
do $$ 
begin
    if not exists (select 1 from pg_proc where proname = 'column_exists') then
        create function column_exists(ptable text, pcolumn text) returns boolean as $$
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
    end if;
end $$;

-- Begin transaction
begin;

-- Save current version
create table if not exists schema_migrations (
    version bigint primary key,
    applied_at timestamp with time zone default current_timestamp
);

-- Check if migration was already applied
do $$
begin
    if exists (select 1 from schema_migrations where version = 20240115000000) then
        raise exception 'Migration 20240115000000 was already applied';
    end if;
end $$;

-- Add new columns to profiles table
do $$
begin
    if not column_exists('profiles', 'phone_number') then
        alter table public.profiles add column phone_number text;
        comment on column public.profiles.phone_number is 'User phone number for contact purposes';
    end if;

    if not column_exists('profiles', 'timezone') then
        alter table public.profiles add column timezone text default 'UTC';
        comment on column public.profiles.timezone is 'User preferred timezone for scheduling';
    end if;
end $$;

-- Add new columns to courses table
do $$
begin
    if not column_exists('courses', 'is_featured') then
        alter table public.courses add column is_featured boolean default false;
        comment on column public.courses.is_featured is 'Flag to mark featured courses';
    end if;

    if not column_exists('courses', 'prerequisites') then
        alter table public.courses add column prerequisites uuid[] default array[]::uuid[];
        comment on column public.courses.prerequisites is 'Array of course IDs that are prerequisites';
    end if;
end $$;

-- Add new columns to meetings table
do $$
begin
    if not column_exists('meetings', 'recording_url') then
        alter table public.meetings add column recording_url text;
        comment on column public.meetings.recording_url is 'URL to the recorded meeting session';
    end if;

    if not column_exists('meetings', 'max_participants') then
        alter table public.meetings add column max_participants integer default 100;
        comment on column public.meetings.max_participants is 'Maximum number of participants allowed';
    end if;

    if not column_exists('meetings', 'is_private') then
        alter table public.meetings add column is_private boolean default false;
        comment on column public.meetings.is_private is 'Flag to indicate if meeting is private';
    end if;
end $$;

-- Add new columns to meeting_participants table
do $$
begin
    if not column_exists('meeting_participants', 'device_info') then
        alter table public.meeting_participants add column device_info jsonb;
        comment on column public.meeting_participants.device_info is 'JSON containing participant device information';
    end if;

    if not column_exists('meeting_participants', 'connection_quality') then
        alter table public.meeting_participants add column connection_quality text;
        comment on column public.meeting_participants.connection_quality is 'Connection quality metrics for the participant';
    end if;
end $$;

-- Add new columns to assignments table
do $$
begin
    if not column_exists('assignments', 'allow_late_submission') then
        alter table public.assignments add column allow_late_submission boolean default false;
        comment on column public.assignments.allow_late_submission is 'Flag to allow submissions after due date';
    end if;

    if not column_exists('assignments', 'late_penalty_percentage') then
        alter table public.assignments add column late_penalty_percentage numeric(5,2) default 0;
        comment on column public.assignments.late_penalty_percentage is 'Percentage penalty for late submissions';
    end if;
end $$;

-- Add new columns to assignment_submissions table
do $$
begin
    if not column_exists('assignment_submissions', 'submission_attempts') then
        alter table public.assignment_submissions add column submission_attempts integer default 1;
        comment on column public.assignment_submissions.submission_attempts is 'Number of submission attempts made';
    end if;

    if not column_exists('assignment_submissions', 'late_penalty_applied') then
        alter table public.assignment_submissions add column late_penalty_applied numeric(5,2) default 0;
        comment on column public.assignment_submissions.late_penalty_applied is 'Actual penalty applied to this submission';
    end if;
end $$;

-- Add new columns to course_enrollments table
do $$
begin
    if not column_exists('course_enrollments', 'last_activity_at') then
        alter table public.course_enrollments add column last_activity_at timestamp with time zone;
        comment on column public.course_enrollments.last_activity_at is 'Timestamp of last student activity in course';
    end if;

    if not column_exists('course_enrollments', 'progress_percentage') then
        alter table public.course_enrollments add column progress_percentage numeric(5,2) default 0;
        comment on column public.course_enrollments.progress_percentage is 'Overall course completion percentage';
    end if;
end $$;

-- Create indexes for new columns that will be frequently queried
create index if not exists idx_courses_is_featured on public.courses(is_featured) where is_featured = true;
create index if not exists idx_meetings_is_private on public.meetings(is_private) where is_private = true;
create index if not exists idx_assignments_late_submission on public.assignments(allow_late_submission) where allow_late_submission = true;
create index if not exists idx_course_enrollments_progress on public.course_enrollments(progress_percentage);

-- Add triggers for automatic timestamp updates
create or replace function update_timestamp()
returns trigger as $$
begin
    new.updated_at = current_timestamp;
    return new;
end;
$$ language plpgsql;

-- Create triggers for tables that need timestamp updates
do $$
begin
    if not exists (select 1 from pg_trigger where tgname = 'set_timestamp_profiles') then
        create trigger set_timestamp_profiles
            before update on public.profiles
            for each row
            execute function update_timestamp();
    end if;

    if not exists (select 1 from pg_trigger where tgname = 'set_timestamp_courses') then
        create trigger set_timestamp_courses
            before update on public.courses
            for each row
            execute function update_timestamp();
    end if;
end $$;

-- Record migration
insert into schema_migrations (version) values (20240115000000);

-- Restore triggers
set session_replication_role = default;

-- Commit transaction
commit;

-- Verify migration
do $$
begin
    if not exists (select 1 from schema_migrations where version = 20240115000000) then
        raise exception 'Migration verification failed';
    end if;
end $$;
