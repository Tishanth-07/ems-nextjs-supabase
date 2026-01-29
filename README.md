# Employee Management System (EMS)

A production-ready, full-stack Employee Management System built with **Next.js 14 (App Router)** and **Supabase**.

## 🚀 Tech Stack

- **Framework:** Next.js 14 (Server Components, Server Actions)
- **Database & Auth:** Supabase (PostgreSQL, GoTrue, Realtime, Storage)
- **Styling:** Tailwind CSS v4, Shadcn/UI, Lucide React
- **Themes:** Next-themes (Dark/Light mode)
- **Analytics:** Recharts
- **Notifications:** Sonner (Toaster)

## ✨ Features

- **Role-Based Access Control (RBAC):**
  - **Admin:** Full access to Employee CRUD, Payroll, Analytics.
  - **Manager:** View Team, Approve Leave Requests.
  - **Employee:** View Profile, Clock In/Out, Request Leave.
- **Authentication:**
  - Email/Password Sign-up & Login.
  - Secure Sessions via HttpOnly Cookies.
  - Role-based Middleware protection.
- **Real-time Updates:**
  - Live Attendance tracking (Clock In/Out updates).
  - Instant In-App Notifications for Leave status changes.
- **Data Visualizations:**
  - Interactive charts for Attendance trends and Leave balances.

## 🛠️ Setup & Installation

### 1. Prerequisite
Ensure you have `Node.js 18+` installed.

### 2. Clone Repository
```bash
git clone https://github.com/your-username/ems-nextjs-supabase.git
cd ems-nextjs-supabase
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Supabase Setup
Run the SQL migrations found in `supabase/migrations` via the Supabase SQL Editor:
1. `20240129000000_initial_schema.sql` - Core Schema & Security.
2. `20240129000001_storage_buckets.sql` - Storage setup.

### 5. Run Locally
```bash
npm run dev
```
Visit `http://localhost:3000`.

## 🧪 Testing
RUN `npm run lint` to verify code quality.

## 🔒 Security
- **Row Level Security (RLS):** Enabled on all tables.
- **Middleware:** Protects `/admin`, `/manager`, `/employee` routes matching user role.
- **Server Actions:** Validated inputs and authorized context.

## 📦 Deployment
1. Push to GitHub.
2. Import project into Vercel.
3. Add Environment Variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in Vercel Dashboard.
4. Deploy!
