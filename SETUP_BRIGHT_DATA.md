# 🚀 Quick Setup - Bright Data Integration

## Step 1: Add Bright Data API Key

Open `backend/.env` and add your Bright Data key:

```bash
GROQ_API_KEY=your_groq_key_here
GROQ_MODEL=llama-3.3-70b-versatile
APP_ENV=development
BRIGHT_DATA_KEY=paste_your_bright_data_key_here
```

## Step 2: Restart Backend

```bash
cd ~/lexafrica-ai/backend
source venv/bin/activate
python main.py
```

## Step 3: Test

1. Go to http://localhost:3000
2. Enter: "My landlord won't return my deposit"
3. Click "Analyze My Legal Problem"
4. Click the **"🌐 Sources"** tab
5. You should see live web sources!

## Step 4: Deploy to Railway

1. Go to your Railway dashboard
2. Click on your `lexafrica-backend` service
3. Go to **Variables** tab
4. Add: `BRIGHT_DATA_KEY` = `your_key_here`
5. Railway will auto-redeploy

## Step 5: Test Production

Visit: https://lexafrica-ai-production.up.railway.app

The Sources tab should now show live web data!

---

## 🎥 Demo Video Checklist

- [ ] Show the hero section
- [ ] Enter a legal problem
- [ ] Show 4 agents working
- [ ] Show Advice tab
- [ ] Show Rights tab
- [ ] **Show Sources tab** (🌐 Bright Data!)
- [ ] Click a source URL to prove it's real
- [ ] Download PDF
- [ ] Mention: "Powered by Bright Data Web Intelligence"

---

## 🏆 Submission Checklist

- [ ] Bright Data API key added to `.env`
- [ ] Backend tested locally
- [ ] Railway environment variable updated
- [ ] Production tested
- [ ] Demo video recorded (2 minutes)
- [ ] GitHub repo updated
- [ ] Submit to Web Data UNLOCKED Hackathon

**Prize: $5,000 + AI Startup Program opportunity!**
