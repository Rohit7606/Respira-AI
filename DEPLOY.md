# Deployment Guide

## Vercel Deployment

### Recommended Configuration (Root Directory)
We use the modern Vercel project configuration where the **Root Directory** is set in the Vercel Dashboard, rather than using a `vercel.json` file.

1.  Go to your Vercel Project Dashboard.
2.  Navigate to **Settings** > **General**.
3.  Located **Root Directory**.
4.  Click **Edit** and set it to: `apps/web`.
5.  Click **Save**.

### Build Settings
Vercel should automatically detect Next.js.
- **Framework Preset:** Next.js
- **Build Command:** `next build` (default)
- **Output Directory:** `.next` (default)

### Why "Root Directory"?
- This ensures Vercel treats `apps/web` as the home of the application.
- It correctly handles all path routing, rewrites, and static assets from the root domain (`/`).
- It avoids "Legacy Build" configurations that often cause 404s in monorepos.

### Troubleshooting
- **404 Not Found:**
    - Verify **Root Directory** is `apps/web`.
    - Verify you do NOT have a `vercel.json` file in the repository root (we deleted it).
    - Redeploy (Settings > Git > Redeploy) if settings were changed after the last push.
