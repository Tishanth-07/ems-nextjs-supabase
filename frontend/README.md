This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Authentication System

This project features a robust, secure, and user-friendly authentication system built with **Supabase Auth**, **Next.js Server Actions**, and **Zod** validation.

### Key Features

*   **Role-Based Access Control (RBAC):**
    *   Automatically redirects users to their specific dashboard upon login (`/admin`, `/manager`, `/employee`).
    *   Middleware protection prevents unauthorized access to role-specific routes.
    *   Authenticated users are redirected away from auth pages (login/signup) to their dashboard.

*   **Premium UI/UX:**
    *   **Password Visibility:** Users can toggle password visibility (Eye icon) in all password fields.
    *   **Real-time Strength Validation:** Sign-up and Reset Password forms display a real-time checklist for strong password requirements (8+ chars, uppercase, lowercase, number, special char).
    *   **Feedback:** Toast notifications (via `sonner`) provide clear success/error messages. Loading states are shown on specific buttons.
    *   **Input Formatting:** Uses Shadcn UI components with accessible labeling and focus states.

*   **Profile Management:**
    *   **Profile Photos:** Users can upload, change, or remove their profile photo.
    *   **Camera Integration:** Supports instant photo capture via webcam (HTTPS required for production).
    *   **Supabase Storage:** Photos are securely stored in a public bucket with RLS policies restricting upload/delete access to the owner.

*   **Security:**
    *   **Strong Passwords:** Enforced via Zod schemas on both client and server (min 8 chars, complexity rules).
    *   **Email Verification:** Mandatory OTP email verification flow for new accounts.
    *   **Secure Reset:** Password reset flow uses OTP verification.
    *   **Server-Side Logic:** Authentication logic resides in Server Actions (`app/auth/actions.ts`) to keep sensitive operations secure.

### Technologies
*   **Supabase Auth:** User management and session handling.
*   **Next.js Middleware:** Route protection and session refreshing.
*   **Zod:** Strict schema validation for all forms.
*   **React Hook Form:** Efficient client-side form state management.
*   **Nodemailer:** Custom OTP email delivery (Gmail SMTP).

### Setup
Ensure your `.env.local` contains:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (for admin actions like generating OTPs)
- `GMAIL_USER` and `GMAIL_APP_PASSWORD` (for email/OTP sending)
