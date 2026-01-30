# Implementation Plan: Fix Anomalies Page Build Error

## Goal
Fix `useSearchParams() should be wrapped in a suspense boundary` error preventing Vercel build.
Refactor `apps/web/app/(dashboard)/anomalies/page.tsx` to introduce a client-side `Suspense` boundary around the data fetching component.

## Changes
### `apps/web/app/(dashboard)/anomalies/page.tsx`
- Split `AnomaliesPage` into `AnomaliesPage` (wrapper) and `AnomaliesContent` (logic).
- Wrap `AnomaliesContent` in `<Suspense fallback={<AnomaliesSkeleton />}>`.
- Create `AnomaliesSkeleton` (or use simpler fallback) inline for now.

## Verification
- Run `npm run build` locally.
- Confirm successful build (Exit code 0).
