# Respira-AI Deployment Guide

This guide outlines the steps to deploy the Respira-AI application to production.
We use **Render** for the Python/FastAPI backend (due to ML model requirements) and **Vercel** for the Next.js frontend.

## Prerequisites
- A GitHub repository with this code pushed.
- Accounts on [Render](https://render.com) and [Vercel](https://vercel.com).

---

## Part 1: Backend Deployment (Render)

1.  **New Web Service:**
    - Log in to Render and click **New +** -> **Web Service**.
    - Connect your GitHub repository.

2.  **Configuration:**
    - **Name:** `respira-api` (or similar)
    - **Root Directory:** `apps/api`
        > [!IMPORTANT]
        > You **MUST** set the Root Directory to `apps/api`. If you leave it blank, Render will look for the Dockerfile in the wrong place and fail.
    - **Runtime:** `Docker`
    - **Instance Type:** Free (or Starter if models need more RAM).

3.  **Environment Variables:**
    - Add the following keys (copy from your local `.env`):
        - `SUPABASE_URL`
        - `SUPABASE_KEY`
        - `OPENAI_API_KEY` (if used)

4.  **Deploy:**
    - Click **Create Web Service**.
    - Wait for the build to finish.
    - **Copy the Service URL** (e.g., `https://respira-api.onrender.com`). You will need this for the frontend.

---

## Part 2: Frontend Deployment (Vercel)

1.  **New Project:**
    - Log in to Vercel and click **Add New...** -> **Project**.
    - Import your GitHub repository.

2.  **Configuration:**
    - **Framework Preset:** Next.js (should auto-detect).
    - **Root Directory:** Edit checking to select `apps/web`.

3.  **Environment Variables:**
    - Add the following:
        - `NEXT_PUBLIC_API_URL`: Paste the **Render Backend URL** from Part 1.
        - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase URL.
        - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Key.

4.  **Deploy:**
    - Click **Deploy**.
    - Vercel will build and assign a domain.

---

## Part 3: Verification

1.  Visit the Vercel deployment URL.
2.  Open the Chrome Developer Tools (F12) -> Network tab.
3.  Perform an action (e.g., submit a form).
4.  Verify that requests are going to `https://respira-api.onrender.com/...` and returning `200 OK`.
