-- Enable RLS on all tables
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;

-- Enums
create type user_role as enum ('admin', 'manager', 'employee');
create type leave_status as enum ('pending', 'approved', 'rejected', 'cancelled');
create type attendance_status as enum ('present', 'absent', 'half_day', 'on_leave');
create type employee_status as enum ('active', 'resigned', 'terminated', 'on_leave');

-- Profiles Table (Extends auth.users)
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  role user_role not null default 'employee',
  department text,
  manager_id uuid references profiles(id),
  photo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS for Profiles
alter table profiles enable row level security;

-- Employees Table (HR Details)
create table employees (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references profiles(id) on delete cascade not null unique,
  employee_code text unique not null,
  hire_date date not null default current_date,
  status employee_status default 'active',
  position text,
  salary_rate numeric(10, 2),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS for Employees
alter table employees enable row level security;

-- Attendance Logs Table
create table attendance_logs (
  id bigint generated always as identity primary key,
  employee_id uuid references profiles(id) on delete cascade not null,
  date date not null default current_date,
  clock_in timestamptz,
  clock_out timestamptz,
  duration numeric(5, 2), -- Stored in hours usually, or calculate dynamically
  status attendance_status default 'present',
  created_at timestamptz default now()
);

-- Enable RLS for Attendance Logs
alter table attendance_logs enable row level security;

-- Leaves Table
create table leaves (
  id bigint generated always as identity primary key,
  employee_id uuid references profiles(id) on delete cascade not null,
  type text not null, -- Vacation, Sick, etc.
  start_date date not null,
  end_date date not null,
  reason text,
  status leave_status default 'pending',
  approved_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS for Leaves
alter table leaves enable row level security;

-- Payroll Summaries Table
create table payroll_summaries (
  id bigint generated always as identity primary key,
  employee_id uuid references profiles(id) on delete cascade not null,
  pay_period_start date not null,
  pay_period_end date not null,
  total_hours numeric(6, 2) default 0,
  gross_pay numeric(10, 2) default 0,
  net_pay numeric(10, 2) default 0,
  created_at timestamptz default now()
);

-- Enable RLS for Payroll Summaries
alter table payroll_summaries enable row level security;

-- Triggers for updated_at
create extension if not exists moddatetime schema extensions;

create trigger handle_updated_at_profiles
  before update on profiles
  for each row execute procedure moddatetime (updated_at);

create trigger handle_updated_at_employees
  before update on employees
  for each row execute procedure moddatetime (updated_at);

create trigger handle_updated_at_leaves
  before update on leaves
  for each row execute procedure moddatetime (updated_at);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'employee')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS Policies

-- Profiles
-- Admins can view/edit all. Managers can view their team. Users can view/edit themselves.
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using ( true );

create policy "Users can update their own profile"
  on profiles for update
  using ( auth.uid() = id );

-- Employees
-- Admins/Managers can view all.
create policy "Employees viewable by team and admin"
  on employees for select
  using ( 
    auth.uid() = profile_id 
    or exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'manager'))
  );

-- Attendance
create policy "Users manage their own attendance"
  on attendance_logs for all
  using ( auth.uid() = employee_id );
  
create policy "Admins/Managers view attendance"
  on attendance_logs for select
  using ( exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'manager')) );

-- Leaves
create policy "Users manage their own leaves"
  on leaves for all
  using ( auth.uid() = employee_id );

create policy "Admins/Managers manage leaves"
  on leaves for all
  using ( exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'manager')) );
