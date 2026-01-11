# 🚀 Alpha-Orion Deployment Guide

**Complete Step-by-Step Deployment to Render.com**

---

## 📋 Prerequisites

Before deploying, ensure you have:

- ✅ GitHub account
- ✅ Render.com account (free tier available)
- ✅ Google Gemini API key ([Get one here](https://ai.google.dev/))
- ✅ Git installed locally
- ✅ All Phase 2 fixes completed

---

## 🔧 Pre-Deployment Checklist

### 1. Verify Local Setup

```bash
# Test backend locally
cd backend
npm start
# Should see: "🚀 ArbiNexus Backend Server started"

# Test frontend locally (in new terminal)
npm run dev
# Should see: "VITE v6.4.1 ready"

# Test production build
npm run build
# Should complete without errors
```

### 2. Verify Environment Files

**Backend `.env` (DO NOT commit this file):**
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
PORT=3001
NODE_ENV=production
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

**Frontend `.env.local` (DO NOT commit this file):**
```env
VITE_API_URL=http://localhost:3001
NODE_ENV=development
```

### 3. Update `.gitignore`

Ensure these files are ignored:
```
# Environment files
.env
.env.local
.env.production
backend/.env

# Logs
backend/logs/
*.log

# Dependencies
node_modules/
backend/node_modules/

# Build outputs
dist/
build/
```

---

## 📦 Step 1: Prepare Repository

### 1.1 Initialize Git (if not already done)

```bash
git init
git add .
git commit -m "Initial commit - Alpha-Orion v2.0"
```

### 1.2 Create GitHub Repository

1. Go to [GitHub](https://github.com/new)
2. Create new repository: `alpha-orion`
3. **DO NOT** initialize with README (you already have one)
4. Copy the repository URL

### 1.3 Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/alpha-orion.git
git branch -M main
git push -u origin main
```

---

## 🌐 Step 2: Deploy Backend to Render

### 2.1 Create Backend Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure the service:

**Basic Settings:**
```
Name: arbinexus-backend
Region: Oregon (US West) or closest to you
Branch: main
Root Directory: backend
Runtime: Node
```

**Build & Deploy:**
```
Build Command: npm install
Start Command: npm start
```

**Instance Type:**
```
Free (or Starter for better performance)
```

### 2.2 Configure Environment Variables

In the Render dashboard, add these environment variables:

```
GEMINI_API_KEY = your_actual_gemini_api_key_here
PORT = 3001
NODE_ENV = production
CORS_ORIGIN = https://YOUR_FRONTEND_URL.onrender.com
```

**Important:** Replace `YOUR_FRONTEND_URL` with your actual frontend URL (you'll get this in Step 3)

### 2.3 Deploy Backend

1. Click **"Create Web Service"**
2. Wait for deployment (2-5 minutes)
3. Note your backend URL: `https://arbinexus-backend.onrender.com`

### 2.4 Verify Backend Deployment

Test the health endpoint:
```bash
curl https://arbinexus-backend.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-09T...",
  "uptime": "...",
  "version": "4.2.0",
  "services": {
    "gemini": "configured",
    "server": "running"
  }
}
```

---

## 🎨 Step 3: Deploy Frontend to Render

### 3.1 Update Frontend Configuration

**Create `.env.production` in project root:**
```env
VITE_API_URL=https://arbinexus-backend.onrender.com
```

**Commit this change:**
```bash
git add .env.production
git commit -m "Add production environment config"
git push
```

### 3.2 Create Frontend Service

1. In Render Dashboard, click **"New +"** → **"Static Site"**
2. Connect your GitHub repository
3. Configure the service:

**Basic Settings:**
```
Name: arbinexus-frontend
Region: Oregon (US West) or closest to you
Branch: main
Root Directory: (leave empty - root of repo)
```

**Build & Deploy:**
```
Build Command: npm install && npm run build
Publish Directory: dist
```

### 3.3 Configure Environment Variables

Add this environment variable:
```
VITE_API_URL = https://arbinexus-backend.onrender.com
```

### 3.4 Deploy Frontend

1. Click **"Create Static Site"**
2. Wait for deployment (3-7 minutes)
3. Note your frontend URL: `https://arbinexus-frontend.onrender.com`

---

## 🔄 Step 4: Update CORS Configuration

### 4.1 Update Backend CORS

1. Go to backend service in Render
2. Update `CORS_ORIGIN` environment variable:
```
CORS_ORIGIN = https://arbinexus-frontend.onrender.com
```
3. Save and redeploy

### 4.2 Verify CORS

Open your frontend URL and check browser console for CORS errors. Should be none!

---

## ✅ Step 5: Post-Deployment Verification

### 5.1 Test All Endpoints

```bash
# Health check
curl https://arbinexus-backend.onrender.com/health

# Readiness probe
curl https://arbinexus-backend.onrender.com/ready

# Liveness probe
curl https://arbinexus-backend.onrender.com/live
```

### 5.2 Test Frontend

1. Open `https://arbinexus-frontend.onrender.com`
2. Verify dashboard loads
3. Check browser console for errors
4. Verify strategies are displayed
5. Check bot status indicators

### 5.3 Test API Integration

Open browser DevTools → Network tab:
1. Refresh the page
2. Look for POST request to `/api/forge-alpha`
3. Verify 200 OK response
4. Check response contains strategies

---

## 🔍 Step 6: Monitoring & Maintenance

### 6.1 Set Up Alerts

In Render Dashboard:
1. Go to each service
2. Click "Settings" → "Notifications"
3. Enable email alerts for:
   - Deploy failures
   - Service crashes
   - High memory usage

### 6.2 Monitor Logs

**Backend Logs:**
```bash
# In Render Dashboard
Services → arbinexus-backend → Logs
```

Watch for:
- ✅ Successful requests
- ⚠️ Rate limit warnings
- ❌ Error messages

**Frontend Logs:**
```bash
# In Render Dashboard
Services → arbinexus-frontend → Logs
```

### 6.3 Monitor Performance

Check these metrics daily:
- Response times (should be <500ms)
- Error rates (should be <1%)
- Memory usage (should be stable)
- API usage (Gemini API costs)

---

## 🔧 Troubleshooting

### Issue: Frontend shows "Network Error"

**Solution:**
1. Check backend is running: `curl https://arbinexus-backend.onrender.com/health`
2. Verify CORS_ORIGIN includes frontend URL
3. Check browser console for specific error
4. Verify VITE_API_URL is correct

### Issue: Backend returns 500 errors

**Solution:**
1. Check backend logs in Render
2. Verify GEMINI_API_KEY is set correctly
3. Check if rate limit exceeded
4. Verify all dependencies installed

### Issue: Strategies not loading

**Solution:**
1. Check Network tab in browser DevTools
2. Verify POST request to `/api/forge-alpha` succeeds
3. Check backend logs for Gemini API errors
4. Verify fallback data is working

### Issue: "Too Many Requests" (429)

**Solution:**
1. Rate limit hit (5 req/min for AI)
2. Wait 60 seconds and try again
3. Consider increasing rate limits in production
4. Implement request queuing in frontend

---

## 🚀 Advanced Configuration

### Custom Domain (Optional)

1. Purchase domain (e.g., from Namecheap, GoDaddy)
2. In Render Dashboard:
   - Go to frontend service
   - Click "Settings" → "Custom Domain"
   - Add your domain
   - Update DNS records as instructed
3. Update backend CORS_ORIGIN to include new domain

### SSL Certificate

Render automatically provides SSL certificates for:
- ✅ `.onrender.com` domains
- ✅ Custom domains

No additional configuration needed!

### Auto-Deploy on Push

Already configured! Every push to `main` branch will:
1. Trigger new build
2. Run tests (if configured)
3. Deploy automatically

To disable:
- Go to service settings
- Uncheck "Auto-Deploy"

---

## 📊 Performance Optimization

### Backend Optimization

1. **Enable Caching:**
```javascript
// Add to backend/server.js
const cache = new Map();
app.use((req, res, next) => {
  const key = req.url;
  if (cache.has(key)) {
    return res.json(cache.get(key));
  }
  next();
});
```

2. **Upgrade Instance:**
   - Free tier: 512MB RAM
   - Starter: 1GB RAM ($7/month)
   - Standard: 2GB RAM ($25/month)

### Frontend Optimization

1. **Enable Compression:**
Already enabled in Vite build!

2. **CDN Configuration:**
Render automatically uses CDN for static sites.

3. **Image Optimization:**
Use WebP format and lazy loading.

---

## 💰 Cost Estimation

### Free Tier (Recommended for Testing)

**Backend:**
- Cost: $0/month
- Limitations:
  - Spins down after 15 min inactivity
  - 750 hours/month free
  - Slower cold starts

**Frontend:**
- Cost: $0/month
- Limitations:
  - 100GB bandwidth/month
  - Global CDN included

**Total:** $0/month

### Paid Tier (Recommended for Production)

**Backend (Starter):**
- Cost: $7/month
- Benefits:
  - Always on (no spin down)
  - Faster performance
  - More memory (1GB)

**Frontend:**
- Cost: $0/month (static sites are free)

**Total:** $7/month

---

## 🔐 Security Best Practices

### 1. Environment Variables

✅ **DO:**
- Store API keys in Render environment variables
- Use different keys for dev/prod
- Rotate keys regularly

❌ **DON'T:**
- Commit `.env` files to Git
- Share API keys in chat/email
- Use same key across projects

### 2. CORS Configuration

✅ **DO:**
- Whitelist specific domains
- Update CORS when adding new domains
- Test CORS after deployment

❌ **DON'T:**
- Use `*` (allow all origins) in production
- Forget to update after domain changes

### 3. Rate Limiting

✅ **DO:**
- Monitor rate limit hits
- Adjust limits based on usage
- Implement exponential backoff

❌ **DON'T:**
- Remove rate limiting
- Set limits too high
- Ignore rate limit warnings

---

## 📝 Deployment Checklist

### Pre-Deployment
- [ ] All tests passing locally
- [ ] Production build successful
- [ ] Environment variables configured
- [ ] `.gitignore` updated
- [ ] Code committed to GitHub

### Backend Deployment
- [ ] Service created on Render
- [ ] Environment variables set
- [ ] Build successful
- [ ] Health endpoint responding
- [ ] Logs showing no errors

### Frontend Deployment
- [ ] Service created on Render
- [ ] Environment variables set
- [ ] Build successful
- [ ] Site loads correctly
- [ ] API calls working

### Post-Deployment
- [ ] CORS configured correctly
- [ ] All endpoints tested
- [ ] Frontend UI verified
- [ ] Monitoring enabled
- [ ] Alerts configured
- [ ] Documentation updated

---

## 🎉 Success Criteria

Your deployment is successful when:

✅ Backend health endpoint returns 200 OK  
✅ Frontend loads without errors  
✅ Strategies are displayed on dashboard  
✅ Bot status indicators show correct states  
✅ No CORS errors in browser console  
✅ API calls complete successfully  
✅ Rate limiting works as expected  
✅ Logs show normal operation  

---

## 📞 Support Resources

### Documentation
- [Render Documentation](https://render.com/docs)
- [Vite Documentation](https://vitejs.dev/)
- [Express.js Documentation](https://expressjs.com/)
- [Google Gemini API](https://ai.google.dev/)

### Community
- [Render Community](https://community.render.com/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/render)

### Project Documentation
- `README.md` - Project overview
- `BLUEPRINT.md` - System architecture
- `FINAL_DEPLOYMENT_REPORT.md` - Complete analysis
- `TESTING_REPORT.md` - Test results

---

## 🔄 Continuous Deployment

### Automatic Deployments

Every push to `main` branch triggers:
1. ✅ Build process
2. ✅ Dependency installation
3. ✅ Deployment
4. ✅ Health checks

### Manual Deployments

To manually deploy:
1. Go to Render Dashboard
2. Select service
3. Click "Manual Deploy" → "Deploy latest commit"

### Rollback

If deployment fails:
1. Go to service in Render
2. Click "Deploys" tab
3. Find previous successful deploy
4. Click "Rollback to this deploy"

---

**Deployment Guide Version:** 2.0  
**Last Updated:** January 9, 2026  
**Status:** Production Ready ✅
