# Action Tracker Pro v3.2

This version addresses:

1. "Unable to read user profile: Invalid API key"
2. "Invalid session" on server API calls
3. Sidebar items doing nothing
4. Box connection diagnostics
5. Super Admin user invite flow

## IMPORTANT: exact Vercel variables

Use these names:

NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SECRET_KEY
NEXT_PUBLIC_SITE_URL

BOX_CLIENT_ID
BOX_CLIENT_SECRET
BOX_ENTERPRISE_ID
BOX_ROOT_FOLDER_ID

### Supabase values

NEXT_PUBLIC_SUPABASE_URL:
Your ActionTrackerPro project URL.

NEXT_PUBLIC_SUPABASE_ANON_KEY:
Use the `sb_publishable_...` key from THE SAME Supabase project as the URL.

SUPABASE_SECRET_KEY:
Use the `sb_secret_...` key from THE SAME Supabase project as the URL.

Do not put `sb_secret_...` into any `NEXT_PUBLIC_...` variable.

v3.2 also accepts the old environment variable name
`SUPABASE_SERVICE_ROLE_KEY` as a fallback, but `SUPABASE_SECRET_KEY`
is preferred.

## Why "Invalid API key" happens

Usually one of:
- publishable key belongs to a different Supabase project than the URL
- secret key belongs to a different Supabase project than the URL
- secret key was copied incorrectly
- old Vercel deployment did not receive the updated variables

After changing Vercel variables:
DEPLOYMENTS > REDEPLOY > redeploy without build cache.

Then sign out and sign in again.

## Supabase SQL

Run:
supabase-v3.2-fix.sql

It promotes Sarwar.khalid@miranenergy.com to Super Admin and grants all v3.2 permissions.

## Box

Box Test now runs in this order:
1. Validate browser Supabase session
2. Verify Super Admin profile
3. Obtain Box CCG token
4. Read BOX_ROOT_FOLDER_ID

This makes errors much more specific.

## Navigation

These routes now exist:
- /
- /actions
- /my-actions
- /calendar
- /reports
- /documents
- /admin/users
- /projects
- /settings
- /settings/storage

The non-dashboard modules are starter pages ready for the next development stage.
