# Deployment Guide

## Vercel Deployment

### Configuration
We use a `vercel.json` file to explicitly tell Vercel to build the `apps/web` directory, as this is a monorepo-style structure.

**Current `vercel.json`:**
```json
{
    "version": 2,
    "builds": [
        {
            "src": "apps/web/package.json",
            "use": "@vercel/next"
        }
    ]
}
```

### Build Settings
- **Output:** `standalone` (configured in `next.config.ts`)
- **Framework:** Next.js
- **Root Directory:** (Leave as default `/` if using `vercel.json`, OR set to `apps/web` if deleting `vercel.json`)

### Troubleshooting
- **404 Not Found:** Usually means Vercel is looking for the app in the root instead of `apps/web`. The `vercel.json` fixes this.
- **Build Errors:** Ensure `next.config.ts` has `typescript: { ignoreBuildErrors: true }` and `eslint: { ignoreDuringBuilds: true }` if you want to force a build despite strict checks.
