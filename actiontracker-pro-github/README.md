# ActionTracker Pro

Professional Action & Task Management System dashboard inspired by the supplied reference image.

## What is already working

- KPI cards: Overdue, Due Soon, Open, Completed, Total Actions
- Clicking any KPI card dynamically filters the action list
- Search box filters visible actions
- Responsive action table
- Status / priority charts
- Recent completed actions
- 7-day completion trend
- Supabase integration
- Sample-data fallback if Supabase environment variables are not set
- Ready for GitHub and Vercel

## 1. Upload to GitHub

Create a repository called:

`actiontracker-pro`

Upload all files from this folder to the repository.

## 2. Deploy to Vercel

Import the GitHub repository into Vercel.

Framework should be detected automatically as Next.js.

## 3. Connect Supabase

In Vercel > Project > Settings > Environment Variables, add:

NEXT_PUBLIC_SUPABASE_URL

NEXT_PUBLIC_SUPABASE_ANON_KEY

Use your Supabase Project URL and publishable/anon key.

Do NOT put a Supabase service-role key, Box client secret, Resend secret, or any password in frontend code.

## 4. Expected Supabase table

The page reads from the existing `actions` table and expects these fields:

- id
- action_number
- title
- priority
- status
- current_due_date
- actual_completion_date
- assigned_to

It also joins `profiles.full_name` through the `assigned_to` foreign key.

If your foreign-key relationship has a different generated name, adjust this line in `app/page.jsx`:

`assigned:profiles!actions_assigned_to_fkey(full_name)`

## 5. Next build steps

Recommended next modules:

1. Login page + Supabase Auth
2. Super Admin page
3. Create/Edit Action form
4. Action detail page
5. Comments and attachments
6. Box API upload/download
7. Email notifications
8. Approval workflow
9. Audit trail
10. Role-based security (RLS)

## Important

This starter is designed to look and behave like the supplied dashboard while remaining fully dynamic.

The current action-number click displays a placeholder alert. Replace it later with a real route such as:

`/actions/[id]`
