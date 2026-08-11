# Action Tracker Pro v4.1

Main additions:
- Box CCG diagnostics without exposing secrets.
- Optional BOX_SUBJECT_TYPE / BOX_SUBJECT_ID support.
- Action attachment upload to Box.
- Automatic folder path: Projects / [Project Code] / Actions / [Action Number].
- Embedded Box file preview.
- Box file comments inside Action Tracker Pro.
- Box annotations in embedded preview where supported.
- Open / Edit in Box link for Box-supported editing workflows.

Required Box variables:
BOX_CLIENT_ID
BOX_CLIENT_SECRET
BOX_ENTERPRISE_ID
BOX_ROOT_FOLDER_ID

Optional, recommended only for explicit subject control:
BOX_SUBJECT_TYPE=enterprise

If BOX_SUBJECT_TYPE is omitted, v4.1 defaults to enterprise for the App Access Only Service Account design.

Run `supabase-v4.1.sql` after deployment.

If Box shows "The client credentials are invalid", the OAuth token exchange has failed before folder access is checked. Use Settings > Box Storage > Test Box Connection to see which stage fails. Verify Client ID + Client Secret are from the same Box app, Enterprise ID is correct, and re-authorize the Box app after scope/access changes.
