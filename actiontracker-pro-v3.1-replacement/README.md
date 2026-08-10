# Action Tracker Pro v3 - Miran Energy + Box + Admin Users

## Included
- Supplied Miran Energy logo (`public/miran-energy-logo.png`)
- Super Admin user-management page at `/admin/users`
- Create account by secure email invitation (admin never needs to know the user's password)
- Authority levels + fine-grained permission checkboxes
- Box storage settings page at `/settings/storage`
- Box CCG server authentication helper
- Box connection test API
- Box folder creation API
- Supabase service-role logic kept server-side only

## 1. GitHub
Replace the contents of your current Vercel root folder with this package.
Your current Vercel Root Directory should be the folder containing this package's `package.json`.

## 2. Run database migration
In Supabase SQL Editor run:
`supabase-v3-migration.sql`

Keep the earlier foundation and `supabase-admin.sql` already installed.

## 3. Vercel environment variables
Add:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- NEXT_PUBLIC_SITE_URL=https://actiontracker-pro.vercel.app
- SUPABASE_SERVICE_ROLE_KEY (server only)
- BOX_CLIENT_ID (server only)
- BOX_CLIENT_SECRET (server only)
- BOX_ENTERPRISE_ID
- BOX_ROOT_FOLDER_ID

Never prefix Box secrets or the Supabase service role with `NEXT_PUBLIC_`.

## 4. Box setup
Create a Box Platform App using Server Authentication / Client Credentials Grant (CCG).
Enable only `Read and write all files and folders stored in Box`.
Submit the app for enterprise admin approval.
After approval, note Client ID, Client Secret, Enterprise ID and the Service Account email.

Create a company Box folder, for example:
`Action Tracker Pro`

Invite the app Service Account email to that one folder as Editor.
Copy the numeric folder ID from the Box folder URL and use it as `BOX_ROOT_FOLDER_ID`.

After adding Vercel environment variables, redeploy and sign in as Super Admin.
Open `/settings/storage` and click `Test Box Connection`.

## 5. User creation
Open `/admin/users` as Super Admin.
Enter name, email, job title, role and individual permissions.
The system sends an invitation email. The user creates their own password.

---
## v3.1 Session Fix
This release fixes the `Invalid session` error on User Management and Box Storage.

### After upload/deploy
1. Keep the Vercel root directory pointed to this uploaded folder.
2. Verify all eight environment variables in `.env.example` exist in Vercel.
3. Run `supabase-v3.1-session-fix.sql` in Supabase SQL Editor.
4. Redeploy Vercel without cache.
5. Sign out of Action Tracker Pro and sign in again.
6. Test `/admin/users`, then `/settings/storage`.

The server now validates the logged-in user's access token using the public Supabase client and only then uses the server secret for privileged operations.
