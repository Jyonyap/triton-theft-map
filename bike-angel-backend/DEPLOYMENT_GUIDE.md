# Backend Deployment Guide

This guide covers deploying the Bike Angel backend API to production.

## Prerequisites

- Production database set up (see PRODUCTION_DATABASE_SETUP.md)
- Cloud storage configured (AWS S3 or Cloudinary)
- Email service configured (SendGrid or AWS SES)
- Domain name (optional but recommended)

## Option 1: Railway (Recommended)

Railway offers a generous free tier and automatic deployments from GitHub.

### Step 1: Prepare Your Repository

1. Ensure your code is pushed to GitHub
2. Make sure `.gitignore` excludes:
   - `node_modules/`
   - `.env`
   - `*.log`

### Step 2: Create Railway Project

1. Go to [https://railway.app](https://railway.app)
2. Sign up or log in with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your `bike-angel-backend` repository
6. Railway will automatically detect it's a Node.js project

### Step 3: Configure Environment Variables

In Railway dashboard, go to your service → Variables tab and add:

```env
# Server Configuration
NODE_ENV=production
PORT=3000

# Database Configuration (from your production database)
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=your-db-name
DB_USER=your-db-user
DB_PASSWORD=your-db-password

# Or use DATABASE_URL
DATABASE_URL=postgresql://user:password@host:5432/database

# JWT Configuration
JWT_SECRET=your-production-jwt-secret-min-32-chars
JWT_EXPIRES_IN=7d

# Email Configuration
EMAIL_SERVICE=sendgrid
EMAIL_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@bikeangel.ucsd.edu

# Cloud Storage Configuration
STORAGE_SERVICE=s3

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-west-2
AWS_S3_BUCKET=bike-angel-photos-prod

# CORS Configuration
FRONTEND_URL=https://your-frontend-domain.com

# File Upload Configuration
MAX_FILE_SIZE=5242880
```

### Step 4: Configure Build Settings

Railway should auto-detect these, but verify:

- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Root Directory**: `/` (or `/bike-angel-backend` if in monorepo)

### Step 5: Deploy

1. Click "Deploy" in Railway dashboard
2. Railway will build and deploy your application
3. Monitor the deployment logs for any errors
4. Once deployed, Railway will provide a URL like: `https://bike-angel-backend-production.up.railway.app`

### Step 6: Set Up Custom Domain (Optional)

1. In Railway dashboard, go to Settings → Domains
2. Click "Add Domain"
3. Enter your domain (e.g., `api.bikeangel.com`)
4. Add the CNAME record to your DNS provider:
   - Type: CNAME
   - Name: api (or your subdomain)
   - Value: (provided by Railway)
5. Wait for DNS propagation (5-60 minutes)
6. Railway will automatically provision SSL certificate

### Step 7: Enable Automatic Deployments

Railway automatically deploys when you push to your main branch. To configure:

1. Go to Settings → Deployments
2. Ensure "Auto Deploy" is enabled
3. Select branch (usually `main` or `master`)

## Option 2: Render

Render offers a free tier with automatic SSL and deployments.

### Step 1: Create Web Service

1. Go to [https://render.com](https://render.com)
2. Sign up or log in
3. Click "New" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: bike-angel-backend
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid for better performance)

### Step 2: Configure Environment Variables

Add all environment variables from the Railway example above.

### Step 3: Deploy

1. Click "Create Web Service"
2. Render will build and deploy
3. You'll get a URL like: `https://bike-angel-backend.onrender.com`

### Step 4: Custom Domain

1. Go to Settings → Custom Domain
2. Add your domain
3. Configure DNS with provided CNAME
4. SSL is automatic

## Option 3: Fly.io

Fly.io offers global deployment with edge locations.

### Step 1: Install Fly CLI

```bash
# macOS
brew install flyctl

# Windows
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"

# Linux
curl -L https://fly.io/install.sh | sh
```

### Step 2: Login and Initialize

```bash
cd bike-angel-backend
fly auth login
fly launch
```

Follow the prompts:
- App name: bike-angel-backend
- Region: Choose closest to your users
- PostgreSQL: No (we're using external database)
- Redis: No

### Step 3: Configure Secrets

```bash
fly secrets set NODE_ENV=production
fly secrets set DB_HOST=your-db-host
fly secrets set DB_PASSWORD=your-db-password
fly secrets set JWT_SECRET=your-jwt-secret
fly secrets set EMAIL_API_KEY=your-email-key
fly secrets set AWS_ACCESS_KEY_ID=your-aws-key
fly secrets set AWS_SECRET_ACCESS_KEY=your-aws-secret
# ... add all other secrets
```

### Step 4: Deploy

```bash
fly deploy
```

### Step 5: Custom Domain

```bash
fly certs add api.bikeangel.com
```

Then add the DNS records shown by Fly.

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port | `3000` |
| `DB_HOST` | Database host | `db.supabase.co` |
| `DB_PORT` | Database port | `5432` |
| `DB_NAME` | Database name | `postgres` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | `your-secure-password` |
| `JWT_SECRET` | JWT signing key | `min-32-char-random-string` |
| `EMAIL_API_KEY` | Email service key | `SG.xxx` (SendGrid) |
| `AWS_ACCESS_KEY_ID` | AWS access key | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | `xxx` |
| `AWS_S3_BUCKET` | S3 bucket name | `bike-angel-photos` |
| `FRONTEND_URL` | Frontend URL for CORS | `https://bikeangel.com` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_EXPIRES_IN` | JWT expiration | `7d` |
| `EMAIL_FROM` | From email address | `noreply@bikeangel.com` |
| `MAX_FILE_SIZE` | Max upload size (bytes) | `5242880` (5MB) |
| `AWS_REGION` | AWS region | `us-west-2` |

## Generating Secure Secrets

### JWT Secret

```bash
# Generate a secure 32-character random string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Database Password

Use a password manager or:

```bash
# Generate a secure password
openssl rand -base64 32
```

## Health Check Endpoint

The backend includes a health check endpoint at `/api/health`:

```bash
curl https://your-backend-url.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": "connected",
  "storage": "configured"
}
```

## Monitoring Deployment

### Check Logs

**Railway:**
```bash
# Install Railway CLI
npm install -g @railway/cli
railway login
railway logs
```

**Render:**
- View logs in dashboard under "Logs" tab

**Fly.io:**
```bash
fly logs
```

### Common Issues

#### Database Connection Failed

- Verify `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- Check if database allows connections from deployment platform
- Ensure PostGIS extension is enabled

#### Storage Upload Failed

- Verify AWS credentials (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
- Check S3 bucket exists and has correct permissions
- Verify CORS configuration on S3 bucket

#### CORS Errors

- Ensure `FRONTEND_URL` matches your actual frontend domain
- Include protocol (`https://`) in `FRONTEND_URL`
- Check if frontend is deployed and accessible

#### Email Sending Failed

- Verify `EMAIL_API_KEY` is correct
- Check SendGrid account is active
- Verify sender email is verified in SendGrid

## SSL/TLS Configuration

All recommended platforms (Railway, Render, Fly.io) provide automatic SSL certificates via Let's Encrypt. No manual configuration needed.

### Verify SSL

```bash
curl -I https://your-backend-url.com/api/health
```

Look for `HTTP/2 200` or `HTTP/1.1 200` response.

## Performance Optimization

### Enable Compression

The backend uses compression middleware. Verify it's working:

```bash
curl -H "Accept-Encoding: gzip" -I https://your-backend-url.com/api/zones
```

Look for `Content-Encoding: gzip` header.

### Database Connection Pooling

The backend uses `pg` connection pooling. Default settings:
- Max connections: 20
- Idle timeout: 30 seconds

Adjust in `src/database/init.js` if needed.

### CDN for Photos

Consider using CloudFront (AWS) or Cloudinary CDN for faster photo delivery.

## Scaling

### Horizontal Scaling

All platforms support horizontal scaling:

**Railway:** Settings → Scale → Increase replicas
**Render:** Settings → Scaling → Increase instances
**Fly.io:** `fly scale count 2`

### Vertical Scaling

Upgrade to paid plans for more CPU/RAM:

**Railway:** Settings → Plan → Upgrade
**Render:** Settings → Instance Type → Upgrade
**Fly.io:** Edit `fly.toml` and increase VM size

## Rollback

### Railway

1. Go to Deployments tab
2. Find previous successful deployment
3. Click "Redeploy"

### Render

1. Go to Events tab
2. Find previous deployment
3. Click "Rollback"

### Fly.io

```bash
fly releases
fly releases rollback <version>
```

## Maintenance Mode

To enable maintenance mode, set environment variable:

```env
MAINTENANCE_MODE=true
```

The API will return 503 Service Unavailable for all requests.

## Security Checklist

- [ ] All environment variables set correctly
- [ ] JWT secret is strong (32+ characters)
- [ ] Database password is strong
- [ ] SSL/TLS enabled (automatic on all platforms)
- [ ] CORS configured with specific frontend URL
- [ ] Rate limiting enabled (built into backend)
- [ ] File upload size limits configured
- [ ] Database backups configured
- [ ] Monitoring and alerts set up

## Post-Deployment Testing

1. **Health Check**
   ```bash
   curl https://your-api.com/api/health
   ```

2. **Test Registration**
   ```bash
   curl -X POST https://your-api.com/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@ucsd.edu","password":"Test123!","name":"Test User"}'
   ```

3. **Test Zones Endpoint**
   ```bash
   curl https://your-api.com/api/zones
   ```

4. **Test Photo Upload** (requires authentication)
   - Use Postman or frontend application

## Support

- Railway: [https://docs.railway.app](https://docs.railway.app)
- Render: [https://render.com/docs](https://render.com/docs)
- Fly.io: [https://fly.io/docs](https://fly.io/docs)

## Next Steps

After backend deployment:
1. Update frontend `VITE_API_BASE_URL` with your backend URL
2. Deploy frontend (see frontend deployment guide)
3. Test end-to-end functionality
4. Set up monitoring and alerts
