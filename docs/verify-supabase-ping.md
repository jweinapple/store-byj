# Verifying Supabase Daily Ping Setup

## How It Works

Your Supabase database is kept active by a GitHub Action that runs **daily at 9:00 AM UTC**. It pings your health endpoint at `/api/health`, which queries the Supabase database to keep it active.

## Setup Checklist

### 1. GitHub Secrets Configuration

Make sure these secrets are set in your GitHub repository:

1. Go to: https://github.com/jweinapple/store-byj/settings/secrets/actions
2. Verify these secrets exist:
   - `HEALTH_CHECK_SECRET` - Should match your Vercel environment variable

**To add/update secrets:**
- Click "New repository secret"
- Name: `HEALTH_CHECK_SECRET`
- Value: Your health check secret (same as in Vercel)

### 2. Verify the Workflow File

The workflow is located at: `.github/workflows/keep-supabase-alive.yml`

It runs:
- **Daily at 9:00 AM UTC** (via cron schedule)
- **On-demand** (via workflow_dispatch - you can trigger it manually)

### 3. Check Workflow Runs

To verify it's working:

1. Go to: https://github.com/jweinapple/store-byj/actions
2. Look for "Keep Supabase Active" workflow
3. Check recent runs - they should show ✅ success

### 4. Manual Test

You can manually trigger the workflow:
1. Go to: https://github.com/jweinapple/store-byj/actions/workflows/keep-supabase-alive.yml
2. Click "Run workflow" → "Run workflow" button
3. Watch it execute in real-time

### 5. Test the Health Endpoint Directly

```bash
curl -X GET "https://byj.vercel.app/api/health" \
  -H "Authorization: Bearer YOUR_HEALTH_CHECK_SECRET"
```

Should return: `{"status":"ok","timestamp":"..."}`

## Troubleshooting

**If the workflow fails:**
- Check that `HEALTH_CHECK_SECRET` is set in GitHub Secrets
- Verify the secret value matches your Vercel environment variable
- Check the workflow logs for specific error messages

**To change the schedule:**
- Edit `.github/workflows/keep-supabase-alive.yml`
- Modify the cron expression: `'0 9 * * *'` (minute hour day month weekday)
- Example: `'0 12 * * *'` = daily at 12:00 PM UTC

## Current Schedule

- **Frequency:** Daily
- **Time:** 9:00 AM UTC
- **Action:** Pings `/api/health` endpoint which queries Supabase `orders` table

