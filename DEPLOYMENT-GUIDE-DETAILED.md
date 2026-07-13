# 🚀 ULTRA-DETAILED DEPLOYMENT GUIDE - Make It Live in 30 Minutes

## ✅ What You'll Have at the End
- Backend running on Render.com (live on internet)
- Frontend running on Render/Vercel (live on internet)
- Your own live URL you can share with anyone
- News updating automatically at 9 AM daily

---

## 📋 Prerequisites Checklist

Before starting, you need:
- [ ] GitHub account (free from github.com)
- [ ] Render.com account (free from render.com)
- [ ] Your ANTHROPIC_API_KEY ready
- [ ] All project files downloaded
- [ ] Node.js installed locally (for setup)

**Estimated time:** 30 minutes total

---

# PART 1: CREATE GITHUB REPOSITORY (5 minutes)

## Step 1.1: Create GitHub Account (if you don't have one)

**IF YOU ALREADY HAVE GITHUB:** Skip to Step 1.2

**If not:**
1. Go to https://github.com
2. Click "Sign up"
3. Follow the steps to create account
4. Verify your email
5. You're ready!

---

## Step 1.2: Create New Repository on GitHub

**Visual Guide:**

```
GitHub Dashboard
├─ Click "New" (green button on left)
└─ Repository name
```

**Exact Steps:**

1. Go to https://github.com/new
2. **Repository name:** Enter `daily-news-web-app`
3. **Description:** "Automated daily news app with dual perspectives"
4. **Visibility:** Select "Public" (so Render can access)
5. **Initialize:** Leave unchecked
6. Click **"Create repository"** button

**Result:** You'll see a page with instructions. Copy this URL:
```
https://github.com/YOUR-USERNAME/daily-news-web-app.git
```

You'll need this in the next step.

---

## Step 1.3: Push Your Code to GitHub (Using Git)

**Make sure you have all project files in a folder called `daily-news-web-app`**

Open terminal/command prompt in that folder:

```bash
# Initialize git
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit: Daily news web app with dual perspectives"

# Add remote (use YOUR URL from Step 1.2)
git remote add origin https://github.com/YOUR-USERNAME/daily-news-web-app.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Expected output:**
```
Counting objects: 10, done.
Delta compression using up to 8 threads.
Compressing objects: 100% (8/8), done.
Writing objects: 100% (10/10), 1.23 KiB | 0 bytes/s, done.
Total 10 (delta 2), reused 0 (delta 0)
remote: Create a pull request for 'main' on GitHub by visiting:
remote:      https://github.com/YOUR-USERNAME/daily-news-web-app/pull/new/main
```

✅ **Your code is now on GitHub!**

---

# PART 2: DEPLOY BACKEND TO RENDER.COM (10 minutes)

## Step 2.1: Create Render.com Account (if needed)

**IF YOU ALREADY HAVE RENDER:** Skip to Step 2.2

**If not:**
1. Go to https://render.com
2. Click "Get Started" (blue button)
3. Sign up with GitHub (easiest!)
4. Authorize Render to access GitHub
5. You're ready!

---

## Step 2.2: Create Web Service on Render

**Visual steps:**

```
Render Dashboard
├─ Click "New +" (blue button)
└─ Select "Web Service"
```

**Exact Steps:**

1. Go to https://dashboard.render.com
2. Click **"New +"** button → **"Web Service"**
3. **Connect repository:**
   - Select "GitHub"
   - Choose your `daily-news-web-app` repo
   - Click "Connect"

4. **Name your service:**
   - Name: `daily-news-backend`
   - Region: Select closest to you (or US East)
   - Branch: `main`
   - Runtime: `Node`

5. **Build command:**
   ```
   npm install
   ```

6. **Start command:**
   ```
   npm start
   ```

7. **Environment Variables:** Click "Add Environment Variable"
   - Add these:
   ```
   KEY                    VALUE
   ANTHROPIC_API_KEY      sk-ant-xxxxx (your API key)
   PORT                   5000
   NODE_ENV               production
   ```

8. **Plan:** Select "Free" (bottom right)

9. Click **"Create Web Service"**

**Result:** Render starts building. You'll see:
```
Build in progress...
Deploying...
Live!
```

When it says "Live", click on the service name to get your URL:
```
https://daily-news-backend.onrender.com
```

✅ **Backend is live!** Copy this URL - you'll need it for frontend.

---

## Step 2.3: Verify Backend is Working

In your browser, visit:
```
https://daily-news-backend.onrender.com/api/health
```

**You should see:**
```json
{
  "status": "ok",
  "timestamp": "2026-07-09T...",
  "lastNewsUpdate": null
}
```

If you see this, your backend is working! ✅

---

# PART 3: DEPLOY FRONTEND TO RENDER (10 minutes)

## Step 3.1: Update Frontend .env File

**In your `news-web-app-frontend` folder:**

Edit `.env` file to use your LIVE backend:

```
REACT_APP_API_URL=https://daily-news-backend.onrender.com/api
```

(Replace with your actual URL from Step 2.2)

**Important:** This must be the HTTPS URL from Render, not localhost!

---

## Step 3.2: Prepare Frontend for Deployment

**In `news-web-app-frontend` folder:**

```bash
# Build the app
npm run build

# This creates a 'build' folder - Render will serve this
```

This takes ~2 minutes. Wait for it to complete.

---

## Step 3.3: Create `render.yaml` for Frontend

**In your `news-web-app-frontend` folder**, create a file called `render.yaml`:

```yaml
services:
  - type: web
    name: daily-news-frontend
    runtime: static
    staticPublishPath: ./build
    buildCommand: npm install && npm run build
    envVars:
      - key: REACT_APP_API_URL
        value: https://daily-news-backend.onrender.com/api
```

---

## Step 3.4: Push Frontend to GitHub

In `news-web-app-frontend` folder:

```bash
git init
git add .
git commit -m "Daily news frontend - React dashboard"
git remote add origin https://github.com/YOUR-USERNAME/daily-news-web-app-frontend.git
git branch -M main
git push -u origin main
```

✅ Frontend code is on GitHub

---

## Step 3.5: Deploy Frontend on Render

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Static Site"**
3. **Connect repository:**
   - Select `daily-news-web-app-frontend`
   - Click "Connect"

4. **Configure:**
   - Name: `daily-news-frontend`
   - Region: Same as backend
   - Branch: `main`
   - Build Command:
     ```
     npm install && npm run build
     ```
   - Publish Directory:
     ```
     build
     ```

5. **Environment Variables:**
   - Key: `REACT_APP_API_URL`
   - Value: `https://daily-news-backend.onrender.com/api` (your backend URL)

6. **Plan:** Select "Free"

7. Click **"Create Static Site"**

**Wait for deployment.** When it shows "Live", you'll get a URL:
```
https://daily-news-frontend.onrender.com
```

✅ **Frontend is live!**

---

# PART 4: TEST YOUR LIVE APP (5 minutes)

## Step 4.1: Open Your App

Go to:
```
https://daily-news-frontend.onrender.com
```

**You should see:**
- Beautiful news dashboard
- Categories: Sri Lanka, Finance, World
- News items (or "Loading news...")
- Refresh button
- Search bar

---

## Step 4.2: Manually Fetch News

If no news appears:

1. Click **"🔄 Refresh"** button
2. Wait 30-60 seconds
3. News should appear!

(Or wait until 9 AM when scheduled fetch happens)

---

## Step 4.3: Test Features

✅ Click on a news item → should expand  
✅ Look for **⚖️ Multiple Perspectives** cards  
✅ Click perspective tabs to switch views  
✅ Use search bar to find news  
✅ Click "📚 Archive" to see previous days  

---

## Step 4.4: Verify Dual Perspectives Work

1. Click **"🌍 World"** tab
2. Look for **"⚖️ MULTIPLE PERSPECTIVES"** items
3. Click the news item to expand
4. You should see tabs like:
   - [Palestinian View]
   - [Israeli View]
   - [International View]
5. Click each tab to see different perspectives

**This is your special feature!** ✅

---

# PART 5: SET UP DAILY SCHEDULING (5 minutes)

Your backend automatically fetches news at 9 AM every day. Here's how to verify:

## Step 5.1: Check Render Logs

1. Go to https://dashboard.render.com
2. Click on your backend service (`daily-news-backend`)
3. Click "Logs" tab
4. Look for entries like:
   ```
   [INFO] News Update Started
   [INFO] News Update Completed Successfully
   ```

These appear at 9 AM daily (and whenever you click Refresh).

---

## Step 5.2: Monitor Everything

**Daily checks:**
- Visit your app URL
- Click Refresh button
- Review news quality

**If something breaks:**
- Check Render logs
- Verify ANTHROPIC_API_KEY is set
- Check network in browser (F12)

---

# PART 6: CUSTOMIZE & SHARE (Optional)

## Step 6.1: Get Custom Domain (Optional)

In Render dashboard for frontend:

1. Go to Settings tab
2. Scroll to "Custom Domain"
3. Enter your domain (if you own one)
4. Follow DNS setup instructions

---

## Step 6.2: Share Your App

Send people this URL:
```
https://daily-news-frontend.onrender.com
```

Anyone can visit and see your news!

---

## Step 6.3: Customize Colors (Optional)

To change colors:

1. Edit `src/App.css` in your React folder
2. Find `:root {` section
3. Change color values:
   ```css
   --color-primary: #1a472a;    /* Change these */
   --color-accent: #d7622f;
   ```
4. Commit and push to GitHub
5. Render auto-redeploys! ✅

---

# 🎉 YOU'RE LIVE!

## What You Now Have:

✅ Backend running at:
```
https://daily-news-backend.onrender.com
```

✅ Frontend running at:
```
https://daily-news-frontend.onrender.com
```

✅ News fetches automatically at 9 AM daily

✅ Dual perspectives showing on controversial topics

✅ Share-able link anyone can visit

---

# 🆘 TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| **"No news appears"** | Click Refresh button, wait 30 seconds |
| **"API Connection Error"** | Check REACT_APP_API_URL in frontend .env matches backend URL |
| **"Build failed"** | Check Render logs, verify package.json exists |
| **"Dual perspectives missing"** | Normal if < 9 AM. Click Refresh to manually fetch |
| **"Page looks broken"** | Hard refresh (Ctrl+Shift+R or Cmd+Shift+R) |
| **"Still stuck?"** | Check Render logs for error messages |

---

# 📊 YOUR DEPLOYMENT CHECKLIST

- [ ] Created GitHub account
- [ ] Created GitHub repositories (backend & frontend)
- [ ] Created Render.com account
- [ ] Deployed backend to Render
- [ ] Got backend URL
- [ ] Updated frontend .env with backend URL
- [ ] Deployed frontend to Render
- [ ] Got frontend URL
- [ ] Tested app at frontend URL
- [ ] Clicked Refresh to fetch news
- [ ] Saw news on dashboard
- [ ] Found dual perspective stories
- [ ] Verified daily scheduling in logs
- [ ] Shared URL with friends! 🎉

---

# 🎯 NEXT STEPS

1. **Today:** Follow this guide (30 min)
2. **Tomorrow:** Check if news appeared at 9 AM
3. **This week:** Customize colors/categories if desired
4. **Ongoing:** Share the URL, enjoy automated balanced news!

---

# 💡 Remember

- Your app is now live 24/7
- News fetches automatically at 9 AM
- You can manually refresh anytime
- It's free on Render.com
- You can share the URL with anyone
- Backend handles all the automation
- Frontend is just for viewing

**That's it! You're done! 🚀✨**

---

**Questions? Check the troubleshooting section above. Still stuck? Review the exact step you're on and double-check URLs and environment variables.**
