# Action Tracker Pro v4.0

This version turns the previous placeholder pages into working modules.

## Working now

- Logout from the sidebar
- Super Admin user list including email and last login
- Create a user with a generated temporary password
- Reset a user's temporary password
- Force temporary-password users to change password after login
- Create and list projects
- Create and assign actions
- Dynamic action register
- My Actions
- Action detail/status/progress update
- Live report summary
- Calendar due-date view
- Box connection test
- List Box root folder contents
- Create a folder inside the configured Box root
- Documents page reads the Box root folder

## Password security

Action Tracker Pro cannot and should not display a user's existing password.
Supabase authentication stores passwords securely. The Super Admin workflow instead:
1. Generates a temporary password
2. Shows it once to the Super Admin
3. Flags the account to change password at first login
4. Allows the Super Admin to issue a new temporary password later

No plaintext password is stored in the Action Tracker database.

## SQL

Run:
`supabase-v4.0.sql`

## Vercel variables

NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SECRET_KEY
NEXT_PUBLIC_SITE_URL

BOX_CLIENT_ID
BOX_CLIENT_SECRET
BOX_ENTERPRISE_ID
BOX_ROOT_FOLDER_ID

After environment-variable changes:
Redeploy without build cache and sign in again.
