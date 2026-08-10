# Action Tracker Pro v2 - Miran Energy

## New in v2

- Miran Energy branded login
- Supabase email/password sign-in
- Forgot Password secure email reset
- Reset Password page
- Protected dashboard
- Sarwar account promoted to `super_admin`
- Dashboard much closer to the supplied reference
- KPI cards dynamically filter the full action list
- Box remains the document storage target
- Supabase stores Box metadata only
- Starter Row Level Security policies

## 1. Replace GitHub files

Upload the contents of this ZIP into your existing GitHub folder:

`actiontracker-pro-github`

Replace existing files when GitHub asks.

## 2. Create the Auth user

Supabase > Authentication > Users > Add user

Email:
`Sarwar.khalid@miranenergy.com`

Set a NEW temporary password.

Do not hard-code any password in GitHub or SQL.

## 3. Run the SQL

Supabase > SQL Editor > New query

Paste and run:
`supabase-admin.sql`

The final SELECT should show:

`system_role = super_admin`

## 4. Password reset URL

Supabase > Authentication > URL Configuration

Site URL:
`https://actiontracker-pro.vercel.app`

Additional Redirect URL:
`https://actiontracker-pro.vercel.app/reset-password`

If your actual Vercel domain differs, use your exact production domain.

## 5. Vercel variables

Keep only the public browser credentials:

`NEXT_PUBLIC_SUPABASE_URL`

`NEXT_PUBLIC_SUPABASE_ANON_KEY`

Never place `sb_secret_...` in a NEXT_PUBLIC variable or GitHub.

## 6. Box storage

Do not enable/use Supabase Storage for action files.

The actual files will go to Company Box.

Database metadata uses:
- box_file_id
- box_folder_id
- box_file_version_id
- box_web_url
- file name
- file size
- revision
- uploaded_by

Box API integration will be added after the Create Action / Action Detail workflow is working.

## Logo

`public/miran-energy-logo.svg` is a placeholder brand treatment. Replace it with the official Miran Energy logo when you provide the official logo file.
