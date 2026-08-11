# Action Tracker Pro v5.0

## Root Directory

If uploaded to GitHub exactly as a subfolder:

actiontracker-pro-v5.0

Use that exact value in Vercel > Settings > Build and Deployment > Root Directory.

## New in v5.0

- Dynamic Dashboard KPI cards
- Dashboard filters by project, owner, priority, status and search
- Live status donut chart
- Live priority chart
- Live completion trend
- User Remove / Restore workflow
- Historical records preserved when user is removed
- Temporary password reset remains available
- Urgency-based due-date SLA
- File attachment during action creation
- Automatic Box path using Action Number
- File preview / comments / annotations
- Upload a revised file as a new Box version
- Box diagnostics improved

## Urgency SLA

There is no universal PMI/ISO rule that defines exact days for each urgency.
v5.0 implements a corporate Action Management SLA:

Critical = 1 calendar day
High = 3 calendar days
Medium = 7 calendar days
Low = 14 calendar days
Routine = 30 calendar days

Due date starts from assignment date.

Super Admin can override, but an override reason is mandatory.

## Box folder structure

Configured Box Root
└── Projects
    └── [Project Code]
        └── Actions
            └── [Action Number]
                └── uploaded files

## Current Box authentication error

If Settings > Box Storage still returns:

"The client credentials are invalid"

this response comes from Box OAuth before the folder is checked.

Verify:
1. BOX_CLIENT_ID and BOX_CLIENT_SECRET are from the same Box app.
2. Fetch a fresh Client Secret from that exact app.
3. BOX_ENTERPRISE_ID is the company Enterprise ID.
4. BOX_SUBJECT_TYPE should be enterprise or left unset for this design.
5. Save Box app configuration.
6. Re-authorize the app after configuration changes.
7. Redeploy Vercel after updating environment variables.

## Required Vercel variables

NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SECRET_KEY
NEXT_PUBLIC_SITE_URL

BOX_CLIENT_ID
BOX_CLIENT_SECRET
BOX_ENTERPRISE_ID
BOX_ROOT_FOLDER_ID

Optional:
BOX_SUBJECT_TYPE=enterprise

## SQL

Run:
supabase-v5.0.sql
