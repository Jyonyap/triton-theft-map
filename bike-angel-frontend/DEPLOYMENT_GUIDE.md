# Frontend Deployment Guide

This guide covers deploying the Bike Angel frontend to production.

## Prerequisites

- Backend API deployed and accessible
- Backend URL (e.g., `https://api.bikeangel.com` or `https://bike-angel-backend.up.railway.app`)
- Domain name (optional but recommended)

## Option 1: Vercel (Recommended)

Vercel offers the best experience for React + Vite applications with automatic deployments.

### Step 1: Prepare Your Repository

1. Ensure your code is pushed to GitHub
2. Verify `.gitignore` excludes:
   - `node_modules/`
   - `dist/`
   - `.env`
   - `.env.local`

### Step 2: Create Vercel Project

1. Go to [https://vercel.com](https://vercel.com)
2. Sign up or log in with GitHub
3. Click "Add New" → "Project"
4. Import your `bike-angel-frontend` repository
5. Vercel will auto-detect it's a Vite project

### Step 3: Configure Build Settings

Vercel should auto-detect these, but verify:

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 4: Configure Environment Variables

In Vercel dashboard, go to Settings → Environment Variables and add:

```env
VITE_API_BASE_URL=https://your-backend-url.com/api
```

**Important**: Replace `your-backend-url.com` with your actual backend URL.

### Step 5: Deploy

1. Click "Deploy"
2. Vercel will build and deploy your application
3. Monitor the deployment logs
4. Once deployed, you'll get a URL like: `https://bike-angel-frontend.vercel.app`

### Step 6: Set Up Custom Domain (Optional)

1. In Vercel dashboard, go to Settings → Domains
2. Click "Add Domain"
3. Enter your domain (e.g., `bikeangel.com` or `www.bikeangel.com`)
4. Follow DNS configuration instructions:
   - **For apex domain** (bikeangel.com):
     - Type: A
     - Name: @
     - Value: 76.76.21.21
   - **For subdomain** (www.bikeangel.com):
     - Type: CNAME
     - Name: www
     - Value: cname.vercel-dns.com
5. Wait for DNS propagation (5-60 minutes)
6. Vercel will automatically provision SSL certificate

### Step 7: Enable Automatic Deployments

Vercel automatically deploys when you push to your main branch. To configure:

1. Go to Settings → Git
2. Ensure "Production Branch" is set to `main` (or your default branch)
3. Enable "Automatically deploy all branches" if desired

### Step 8: Configure Preview Deployments

Vercel creates preview deployments for pull requests:

1. Go to Settings → Git
2. Enable "Preview Deployments"
3. Each PR will get a unique preview URL

## Option 2: Netlify

Netlify is another excellent option for static site hosting.

### Step 1: Create Netlify Site

1. Go to [https://netlify.com](https://netlify.com)
2. Sign up or log in
3. Click "Add new site" → "Import an existing project"
4. Connect your GitHub repository
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

### Step 2: Configure Environment Variables

1. Go to Site settings → Environment variables
2. Add:
   ```env
   VITE_API_BASE_URL=https://your-backend-url.com/api
   ```

### Step 3: Deploy

1. Click "Deploy site"
2. Netlify will build and deploy
3. You'll get a URL like: `https://bike-angel-frontend.netlify.app`

### Step 4: Custom Domain

1. Go to Domain settings → Add custom domain
2. Follow DNS configuration instructions
3. SSL is automatic

## Option 3: GitHub Pages

GitHub Pages is free but requires some additional configuration for SPAs.

### Step 1: Update Vite Config

Add base path to `vite.config.js`:

```javascript
export default defineConfig({
  base: '/bike-angel-frontend/',  // Your repo name
  // ... rest of config
})
```

### Step 2: Add 404 Handling

Create `public/404.html`:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Bike Angel</title>
    <script>
      sessionStorage.redirect = location.href;
    </script>
    <meta http-equiv="refresh" content="0;URL='/bike-angel-frontend'">
  </head>
</html>
```

Update `index.html` to handle redirects:

```html
<script>
  (function(){
    var redirect = sessionStorage.redirect;
    delete sessionStorage.redirect;
    if (redirect && redirect != location.href) {
      history.replaceState(null, null, redirect);
    }
  })();
</script>
```

### Step 3: Deploy with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm install
        
      - name: Build
        run: npm run build
        env:
          VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL }}
          
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### Step 4: Configure Repository

1. Go to repository Settings → Pages
2. Source: Deploy from a branch
3. Branch: `gh-pages` / `root`
4. Save

## Environment Variables

### Production Environment Variables

Create `.env.production`:

```env
VITE_API_BASE_URL=https://your-backend-url.com/api
```

**Important Notes:**
- Vite only exposes variables prefixed with `VITE_`
- Variables are embedded at build time (not runtime)
- Never commit `.env.production` to git
- Set variables in deployment platform instead

### Verifying Environment Variables

After deployment, check the browser console:

```javascript
console.log(import.meta.env.VITE_API_BASE_URL);
```

Should output your production backend URL.

## Build Optimization

### Step 1: Optimize Bundle Size

Check bundle size:

```bash
npm run build
```

Look for warnings about large chunks (>500 KB).

### Step 2: Enable Code Splitting

Vite automatically code-splits. Verify in `dist/assets/`:
- Multiple JS chunks
- Vendor chunk separate from app code

### Step 3: Optimize Images

Ensure all images are optimized:
- Use WebP format where possible
- Compress images before committing
- Use responsive images with `srcset`

### Step 4: Enable Compression

Most platforms (Vercel, Netlify) automatically enable gzip/brotli compression.

Verify:
```bash
curl -H "Accept-Encoding: gzip" -I https://your-site.com
```

Look for `Content-Encoding: gzip` or `Content-Encoding: br`.

## Progressive Web App (PWA)

The app includes PWA features. Verify after deployment:

### Step 1: Check Manifest

Visit: `https://your-site.com/manifest.json`

Should return the manifest file.

### Step 2: Check Service Worker

Open DevTools → Application → Service Workers

Should show registered service worker.

### Step 3: Test Offline

1. Open app in browser
2. Open DevTools → Network
3. Check "Offline"
4. Refresh page
5. App should still load (cached)

### Step 4: Test "Add to Home Screen"

On mobile:
1. Visit site in browser
2. Look for "Add to Home Screen" prompt
3. Add to home screen
4. Open from home screen
5. Should open in standalone mode (no browser UI)

## Performance Testing

### Lighthouse Audit

1. Open site in Chrome
2. Open DevTools → Lighthouse
3. Run audit for:
   - Performance
   - Accessibility
   - Best Practices
   - SEO
   - PWA

Target scores:
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+
- PWA: 100

### Core Web Vitals

Monitor:
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

Use [PageSpeed Insights](https://pagespeed.web.dev/) to test.

## Security Headers

### Vercel

Create `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=(self)"
        }
      ]
    }
  ]
}
```

### Netlify

Create `netlify.toml`:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=(self)"
```

## Monitoring

### Error Tracking

Consider adding Sentry for frontend error tracking:

```bash
npm install @sentry/react
```

Configure in `main.jsx`:

```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: import.meta.env.MODE,
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});
```

### Analytics (Optional)

Consider adding:
- Google Analytics
- Plausible Analytics (privacy-friendly)
- Umami (self-hosted, privacy-friendly)

## Testing Production Build Locally

Before deploying, test the production build locally:

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

Visit `http://localhost:4173` and test all features.

## Rollback Procedure

### Vercel

1. Go to Deployments tab
2. Find previous successful deployment
3. Click "..." → "Promote to Production"

### Netlify

1. Go to Deploys tab
2. Find previous deployment
3. Click "Publish deploy"

### GitHub Pages

1. Revert the commit that caused issues
2. Push to main branch
3. GitHub Actions will redeploy

## Post-Deployment Checklist

- [ ] Site accessible at production URL
- [ ] API connection working (check Network tab)
- [ ] All pages loading correctly
- [ ] Images loading correctly
- [ ] Map displaying correctly
- [ ] Camera access working on mobile
- [ ] User registration working
- [ ] Login working
- [ ] Photo upload working
- [ ] Theft reporting working
- [ ] PWA installable
- [ ] Offline mode working
- [ ] Mobile responsive
- [ ] Cross-browser tested (Chrome, Safari, Firefox)
- [ ] Lighthouse score > 90
- [ ] No console errors
- [ ] HTTPS enabled
- [ ] Custom domain working (if configured)

## Troubleshooting

### API Connection Failed

**Symptom**: Network errors, CORS errors

**Solutions**:
1. Verify `VITE_API_BASE_URL` is set correctly
2. Check backend CORS configuration includes frontend URL
3. Ensure backend is deployed and accessible
4. Check browser console for specific error

### Build Failed

**Symptom**: Deployment fails during build

**Solutions**:
1. Check build logs for specific error
2. Test build locally: `npm run build`
3. Verify all dependencies are in `package.json`
4. Check Node.js version compatibility

### Environment Variables Not Working

**Symptom**: `undefined` when accessing `import.meta.env.VITE_API_BASE_URL`

**Solutions**:
1. Ensure variable name starts with `VITE_`
2. Rebuild after changing environment variables
3. Check deployment platform has variables set
4. Clear cache and redeploy

### PWA Not Installing

**Symptom**: No "Add to Home Screen" prompt

**Solutions**:
1. Verify HTTPS is enabled
2. Check `manifest.json` is accessible
3. Verify service worker is registered
4. Check browser console for PWA errors
5. Test on different browsers/devices

### Slow Load Times

**Symptom**: Poor Lighthouse performance score

**Solutions**:
1. Enable code splitting
2. Optimize images
3. Enable compression
4. Use CDN for assets
5. Lazy load components
6. Reduce bundle size

## Support

- Vercel: [https://vercel.com/docs](https://vercel.com/docs)
- Netlify: [https://docs.netlify.com](https://docs.netlify.com)
- Vite: [https://vitejs.dev/guide/](https://vitejs.dev/guide/)

## Next Steps

After frontend deployment:
1. Test complete user flows end-to-end
2. Set up monitoring and analytics
3. Create user documentation
4. Prepare launch announcement
5. Monitor for issues and user feedback
