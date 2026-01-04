# IPv6 Connection Issue - SOLVED

## Problem
Render's free tier tries to connect to Supabase using IPv6, but Supabase's direct connection (`db.ujfwjpxdjfqtjeexllsr.supabase.co:5432`) doesn't support IPv6 from Render.

Error: `connect ENETUNREACH 2600:1f1c:f9:4d11:cb54:e67a:d00b:eef2:5432`

## Root Cause
- Render resolves `db.ujfwjpxdjfqtjeexllsr.supabase.co` to an IPv6 address
- Node.js pg library tries IPv6 first
- Supabase rejects the IPv6 connection from Render
- Connection fails with "network unreachable"

## Solution
**Use Supabase Connection Pooler instead of direct connection**

The connection pooler (`aws-0-us-east-2.pooler.supabase.com:6543`) properly handles IPv4/IPv6 and works with Render.

### Required Render Environment Variables

Go to Render → Your service → Environment tab and set:

```
DB_HOST=aws-0-us-east-2.pooler.supabase.com
DB_PORT=6543
DB_USER=postgres.ujfwjpxdjfqtjeexllsr
DB_NAME=postgres
DB_PASSWORD=Tzehoweyap5796!
```

**Key differences from direct connection:**
1. Host: `aws-0-us-east-2.pooler.supabase.com` (not `db.ujfwjpxdjfqtjeexllsr.supabase.co`)
2. Port: `6543` (not `5432`)
3. User: `postgres.ujfwjpxdjfqtjeexllsr` (not just `postgres`)

### Why This Works
- Connection pooler has proper IPv4 support for Render
- Pooler handles connection routing automatically
- No IPv6 issues
- Better for production (connection pooling, better performance)

## Status
✅ Code updated to use connection pooler by default
⏳ Waiting for Render environment variables to be updated
⏳ Waiting for deployment to test

## Next Steps
1. Update Render environment variables (see above)
2. Render will auto-redeploy
3. Test `/api/health` endpoint
4. Should return: `{"status":"ok","database":"connected",...}`
