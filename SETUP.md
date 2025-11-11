# Authentication Setup Guide

This application uses Supabase for authentication and role-based access control.

## Environment Variables

Create a `.env` file in the root directory with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Setup

### 1. Create the Role Enum

```sql
create type public.app_role as enum ('admin', 'user');
```

### 2. Create the user_roles Table

```sql
create table public.user_roles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    role app_role not null,
    unique (user_id, role)
);
```

### 3. Enable Row Level Security

```sql
alter table public.user_roles enable row level security;
```

### 4. Create the has_role Function

```sql
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;
```

### 5. Create RLS Policies

```sql
-- Users can read their own roles
create policy "Users can view own roles"
on public.user_roles
for select
to authenticated
using (auth.uid() = user_id);

-- Admins can manage all roles
create policy "Admins can manage roles"
on public.user_roles
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));
```

### 6. Assign First Admin (After First User Signs Up)

```sql
-- Replace 'user-uuid-here' with the actual user ID
insert into public.user_roles (user_id, role)
values ('user-uuid-here', 'admin');
```

## Authentication Configuration

In your Supabase dashboard:

1. Go to **Authentication → URL Configuration**
2. Set **Site URL** to your application URL (e.g., `http://localhost:5173` for development)
3. Add **Redirect URLs**:
   - `http://localhost:5173/**` (for development)
   - Your production URL (when deployed)

4. (Optional) Disable email confirmation for faster testing:
   - Go to **Authentication → Providers → Email**
   - Disable "Confirm email"

## Features

- ✅ Sign Up with email/password
- ✅ Sign In with email/password
- ✅ Forgot Password flow
- ✅ Role-based access control (Admin/User)
- ✅ Dark/Light mode toggle
- ✅ Responsive design
- ✅ Black and white theme

## Pages

- `/` - Landing page
- `/auth` - Login/Sign Up/Reset Password
- `/dashboard` - User dashboard (protected)
- `/admin` - Admin panel (admin only)
