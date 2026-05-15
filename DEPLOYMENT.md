# ElSpa Manager - Cloudflare Deployment Guide

## 🚀 Quick Start (Recommended: Cloudflare Pages)

### Why Pages vs Workers?

| Feature | Pages | Workers |
|---------|-------|---------|
| Purpose | Static sites & SSG | Serverless functions |
| Setup Time | 2 minutes | 15+ minutes |
| Cost | Free tier generous | Pay-per-request |
| Next.js Support | ✅ Native | ⚠️ Requires adapter |
| Build Output | .next folder | Needs compilation |

**For your Next.js SSG app, Pages is the optimal choice.**

---

## 📋 Cloudflare Pages Setup

### Step 1: Configure in Cloudflare Dashboard

1. **Connect GitHub**
   - New Project → Connect Git Repository
   - Select `jitnet57/elspa`
   - Authorize Cloudflare access

2. **Build Settings**
   - Framework: None (custom)
   - Build command: `npm install --prefix frontend && npm run build --prefix frontend`
   - Build output directory: `frontend/.next`
   - Root directory: `/`

3. **⚠️ Important: Do NOT set a Deploy Command**
   - Leave "Deploy command" empty
   - Pages will automatically detect .next folder
   - ❌ Avoid: `npx wrangler deploy` (this is for Workers only)

4. **Save and Deploy**
   - First deployment will take 2-5 minutes
   - You'll get a unique URL: `XXXXX.pages.dev`

### Step 2: Test Deployment

```bash
# After deployment completes:
1. Open: https://XXXXX.pages.dev
2. Check: Dashboard loads (✓ responsive)
3. Test: All navigation links work
4. Verify: External links open in new tabs
```

### Step 3: Connect Custom Domain (Optional)

1. Go to Pages project settings
2. Custom domains → Add custom domain
3. Update DNS records as instructed

---

## ⚙️ Cloudflare Workers Setup (Advanced)

If you prefer Workers for edge computing features:

### Step 1: Install Adapter

```bash
cd frontend
npm install --save-dev @cloudflare/next-on-workers
```

### Step 2: Update wrangler.toml

Configured and ready at `./wrangler.toml`

### Step 3: Local Testing

```bash
# Install wrangler
npm install -g wrangler

# Test locally
wrangler dev

# Build and deploy
npm run build
wrangler deploy
```

---

## 🔍 Troubleshooting

### Issue: "Page not found" after deployment

**Solution**: 
- Clear Cloudflare cache: Dashboard → Caching → Purge Everything
- Verify .next folder exists in Pages build output

### Issue: Build fails with "npm not found"

**Solution**:
- Ensure build command includes: `npm install --prefix frontend`
- Check Node.js version: >= 18.0.0

### Issue: External links don't open in new tabs

**Solution**:
- Already implemented in `frontend/src/app/providers.tsx`
- Check browser console for errors
- Clear cache and reload: Ctrl+Shift+Delete

### Issue: Mobile layout broken

**Solution**:
- Responsive design implemented using Tailwind breakpoints
- Check DevTools: Ctrl+Shift+I → Toggle device toolbar
- Test on actual mobile device

---

## 📦 Build Output Structure

```
frontend/
├── .next/                    (Cloudflare Pages serves from here)
│   ├── static/              (CSS, JS, images)
│   ├── server/              (Server-rendered components)
│   └── app.html
├── src/
│   ├── app/                 (Page routes)
│   ├── components/          (React components)
│   └── lib/                 (Utilities)
└── public/                  (Static assets)
```

---

## 🔐 Environment Variables

If you need environment variables in production:

### For Cloudflare Pages:

1. Dashboard → Project settings → Environment variables
2. Add variables (e.g., `API_URL`, `NEXT_PUBLIC_*`)
3. They're automatically available in builds

### For Cloudflare Workers:

Add to `wrangler.toml`:
```toml
[env.production]
vars = { API_URL = "https://api.example.com" }
```

---

## ✅ Verification Checklist

- [ ] GitHub repository connected
- [ ] Build command set correctly
- [ ] Build output directory: `frontend/.next`
- [ ] No deploy command set
- [ ] First build successful
- [ ] Pages URL accessible
- [ ] All 25 pages load
- [ ] Navigation works
- [ ] External links open in new tabs
- [ ] Mobile responsive (test on phone)
- [ ] InAppBrowserBanner shows on mobile browsers

---

## 📞 Support

- Cloudflare Pages Docs: https://developers.cloudflare.com/pages/
- Next.js Deployment: https://nextjs.org/docs/deployment/
- Community: https://discord.gg/cloudflaredev
