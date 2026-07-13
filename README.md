# 📁 BACKEND FOLDER

## 📋 What's Inside

- **server.js** - Your Node.js backend server
- **package.json** - Dependencies list
- **.env.example** - Configuration template

## 🚀 What To Do

### Step 1: Copy These Files to Your Computer

```
daily-news-web-app/
├── server.js
├── package.json
└── .env.example
```

### Step 2: Create .env File

Copy `.env.example` to `.env` and fill in:

```
ANTHROPIC_API_KEY=sk-ant-xxxxx  (your API key here)
PORT=5000
NODE_ENV=production
SCHEDULE_TIME=0 9 * * *
TZ=Asia/Colombo
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Test Locally (Optional)

```bash
npm start
```

Visit: `http://localhost:5000/api/health`

### Step 5: Push to GitHub

Follow instructions in DOCS/STEP-1-3-EXPLAINED.md

### Step 6: Deploy to Render.com

Follow DOCS/DEPLOYMENT-GUIDE-DETAILED.md (Part 2)

---

## 📦 Files Explained

| File | Purpose |
|------|---------|
| **server.js** | Main backend (15KB, ~400 lines) |
| **package.json** | Lists all dependencies npm needs to install |
| **.env.example** | Template for environment variables |

---

## ✅ Checklist

- [ ] Copy all 3 files to your computer
- [ ] Copy .env.example to .env
- [ ] Add your API key to .env
- [ ] Run npm install
- [ ] Push to GitHub
- [ ] Deploy to Render.com

---

**Next: Read DOCS/DEPLOYMENT-GUIDE-DETAILED.md**
