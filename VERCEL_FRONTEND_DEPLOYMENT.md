# Deploy Frontend to Vercel - Step by Step Guide 🚀

## What You'll Need
- GitHub account (you already have this!)
- Your repository: `https://github.com/Jyonyap/triton-theft-map`
- Backend URL: `https://triton-theft-map.onrender.com`
- 5 minutes of time

---

## Step 1: Sign Up for Vercel

1. **Open your browser** and go to: **https://vercel.com/**

2. **Click "Sign Up"** (top right corner)

3. **Sign up with GitHub**:
   - Click "Continue with GitHub"
   - Authorize Vercel to access your GitHub account
   - This connects Vercel to your repositories

---

## Step 2: Import Your Project

1. **After signing in**, you'll see the Vercel Dashboard

2. **Click "Add New..."** button (top right)

3. **Select "Project"** from the dropdown

4. **Import Git Repository**:
   - You'll see a list of your GitHub repositories
   - Find: **`triton-theft-map`**
   - Click **"Import"** next to it

---

## Step 3: Configure Your Project

Now you'll see a configuration screen. Fill it out exactly like this:

### Project Settings

**Project Name:**
```
triton-theft-map
```
(Vercel will auto-generate this, you can keep it or change it)

**Framework Preset:**
```
Vite
```
✅ Vercel should auto-detect this!

**Root Directory:**
```
bike-angel-frontend
```
⚠️ **CRITICAL**: Click "Edit" next to Root Directory and set it to `bike-angel-frontend`

**Build Command:**
```
npm run build
```
(Should be auto-filled)

**Output Directory:**
```
dist
```
(Should be auto-filled)

**Install Command:**
```
npm install
```
(Should be auto-filled)

---

## Step 4: Add Environment Variables

This is the most important part! Scroll down to find **"Environment Variables"** section.

**Click "Add"** and add this variable:

### Variable 1: VITE_API_BASE_URL
- **Name:** `VITE_API_BASE_URL`
- **Value:** `https://triton-theft-map.onrender.com/api`
- **Environment:** Select "Production" (default)

⚠️ **IMPORTANT**: Make sure the URL ends with `/api` and has NO trailing slash!

---

## Step 5: Deploy!

1. **Double-check** your settings:
   - Root Directory: `bike-angel-frontend` ✅
   - Environment Variable: `VITE_API_BASE_URL` set ✅

2. **Click the big "Deploy" button**

3. **Wait for deployment** (2-5 minutes):
   - You'll see a build log with lots of text
   - Look for messages like:
     - ✅ "Building..."
     - ✅ "Deploying..."
     - ✅ "Ready!"
   - Vercel will show a celebration animation when done! 🎉

---

## Step 6: Get Your Frontend URL

1. **Once deployment is complete**, you'll see your live site!

2. **Your frontend URL** will look like:
   ```
   https://triton-theft-map.vercel.app
   ```
   or
   ```
   https://triton-theft-map-xxxx.vercel.app
   ```

3. **Click "Visit"** to see your live site!

4. **Test your app**:
   - Try registering a new account
   - Try logging in
   - Try viewing the map
   - Try reporting a parking spot or theft

---

## Step 7: Update Backend CORS (IMPORTANT!)

Now that your frontend is live, we need to tell the backend to accept requests from it.

### Update Render Environment Variable

1. **Go to Render Dashboard**: https://dashboard.render.com

2. **Click on your backend service**: `triton-theft-map`

3. **Click "Environment"** tab

4. **Find the variable**: `FRONTEND_URL`

5. **Update its value** to your new Vercel URL:
   ```
   https://triton-theft-map.vercel.app
   ```
   (Use YOUR actual Vercel URL from Step 6)

6. **Click "Save Changes"**

7. **Wait for Render to redeploy** (~2 minutes)

---

## Troubleshooting

### ❌ Build Failed?

**Check the build logs for errors:**
- Click on the deployment
- Look for red error messages
- Common issues:
  - Wrong root directory (should be `bike-angel-frontend`)
  - Missing environment variable
  - Node version mismatch

**Solution:**
- Go to Project Settings
- Verify "Root Directory" is `bike-angel-frontend`
- Verify environment variable is set
- Click "Redeploy" from the deployments page

### ❌ Site Loads but API Calls Fail?

**Check environment variable:**
- Go to Project Settings → Environment Variables
- Verify `VITE_API_BASE_URL` is set correctly
- Should be: `https://triton-theft-map.onrender.com/api`
- Make sure it ends with `/api` and NO trailing slash

**Check backend CORS:**
- Make sure you updated `FRONTEND_URL` in Render
- Should match your Vercel URL exactly
- Wait for Render to finish redeploying

**Solution:**
- Fix the environment variable
- Go to Deployments tab
- Click "Redeploy" on the latest deployment

### ❌ Map Not Loading?

**This is normal!** The map uses Leaflet which loads tiles from the internet. If you see a gray box, it's likely:
- Map tiles are loading slowly
- Check browser console for errors
- Make sure you're connected to the internet

---

## What's Next?

✅ **Frontend is deployed!**
✅ **Backend is deployed!**
✅ **Your full app is LIVE!**

**Your live URLs:**
- Frontend: `https://triton-theft-map.vercel.app` (or your custom URL)
- Backend: `https://triton-theft-map.onrender.com`

**Share your app:**
- Send the frontend URL to friends
- Test it on your phone
- Share it with UCSD students!

---

## Quick Reference - Environment Variables

For Vercel (Frontend):
```
VITE_API_BASE_URL=https://triton-theft-map.onrender.com/api
```

For Render (Backend - update FRONTEND_URL):
```
FRONTEND_URL=https://triton-theft-map.vercel.app
```

---

**Time to complete:** ~5 minutes  
**Cost:** $0 (Free tier)  
**Status:** Ready to deploy! 🚀

---

## Automatic Deployments

**Good news!** Vercel automatically redeploys when you push to GitHub:
- Push code to `main` branch
- Vercel detects the change
- Automatically builds and deploys
- Your site updates in ~2 minutes

No manual redeployment needed! 🎉
