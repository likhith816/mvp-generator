# 🚀 Quick Deployment Guide

## Fastest Deployment Options (Choose One)

### 🌟 Option 1: Vercel (Recommended - 5 minutes)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/mvp-generator.git
   git push -u origin main
   ```

2. **Deploy with Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables:
     - `VITE_CONVEX_URL`: Your Convex URL
     - `GEMINI_API_KEY`: Your API key
   - Click Deploy!

3. **Setup Convex Production:**
   ```bash
   npx convex deploy --prod
   ```

**Result: Your app will be live at `https://your-app.vercel.app`**

### ⚡ Option 2: One-Click Scripts

**Windows:**
```bash
deploy.bat
```

**Mac/Linux:**
```bash
chmod +x deploy.sh
./deploy.sh
```

### 🌐 Option 3: Manual Build & Upload

```bash
# Build the project
npm run build

# Upload the 'dist' folder to any hosting:
# - Firebase Hosting
# - AWS S3
# - DigitalOcean App Platform
# - Any web hosting provider
```

## ⚙️ Environment Variables Required

```env
VITE_CONVEX_URL=https://your-deployment.convex.cloud
GEMINI_API_KEY=your_gemini_api_key
```

## 🔧 Pre-Deployment Checklist

- [ ] Run `npm run build` successfully
- [ ] Deploy Convex: `npx convex deploy --prod`
- [ ] Set environment variables on hosting platform
- [ ] Test the build locally: `npm run preview`

## 🎯 After Deployment

1. **Test all features:**
   - User registration/login
   - MVP generation
   - Admin dashboards
   - Google OAuth

2. **Performance:**
   - Your app will be globally distributed
   - HTTPS enabled automatically
   - CDN caching included

3. **Custom domain (optional):**
   - Add your domain in hosting platform settings
   - Update DNS records as instructed

## 🆘 Quick Troubleshooting

- **App shows blank page:** Check environment variables
- **Login not working:** Verify Convex production URL
- **404 on refresh:** Ensure SPA routing is configured
- **Build fails:** Check all dependencies are installed

Your MVP Generator will be live globally in minutes! 🌍✨