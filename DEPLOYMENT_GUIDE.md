# 🚀 Global Deployment Guide

This guide covers multiple deployment options for your React + Convex MVP Generator application.

> **🎯 Quick Start**: For automated deployment setup, see [DEPLOYMENT_SETUP.md](./DEPLOYMENT_SETUP.md)
>
> **📊 Status**: Check current deployment status in [DEPLOYMENT_STATUS.md](./DEPLOYMENT_STATUS.md)

## Prerequisites

Before deploying, ensure you have:
- ✅ A Convex deployment URL from `convex dev --once`
- ✅ Your Gemini API key
- ✅ All code committed to a Git repository

## 🌟 Recommended: Vercel Deployment

### Step 1: Prepare Your Repository
```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit"

# Push to GitHub (create repo first on GitHub)
git remote add origin https://github.com/yourusername/your-repo-name.git
git push -u origin main
```

### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect it's a Vite project
5. Configure environment variables:
   - `VITE_CONVEX_URL`: Your Convex deployment URL
   - `GEMINI_API_KEY`: Your Gemini API key
6. Click "Deploy"

### Step 3: Configure Convex for Production
```bash
# In your project directory
npx convex deploy --prod

# Update your .env.local with the production URL
VITE_CONVEX_URL=https://your-production-deployment.convex.cloud
```

## 🔄 Alternative: Netlify Deployment

### Step 1: Deploy via Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Build your project
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

### Step 2: Configure Environment Variables
1. Go to your Netlify dashboard
2. Site settings → Environment variables
3. Add:
   - `VITE_CONVEX_URL`: Your Convex production URL
   - `GEMINI_API_KEY`: Your Gemini API key

## 📁 Alternative: GitHub Pages

### Step 1: Enable GitHub Pages
1. Go to your GitHub repository
2. Settings → Pages
3. Source: GitHub Actions

### Step 2: Configure Secrets
1. Repository Settings → Secrets and variables → Actions
2. Add repository secrets:
   - `VITE_CONVEX_URL`: Your Convex production URL
   - `GEMINI_API_KEY`: Your Gemini API key

### Step 3: Deploy
```bash
git add .
git commit -m "Add deployment configuration"
git push
```

## 🛠 Manual Build and Deploy

### Option 1: Build for Static Hosting
```bash
# Build the project
npm run build

# The dist/ folder contains your built application
# Upload the contents of dist/ to any static hosting service:
# - AWS S3 + CloudFront
# - Firebase Hosting
# - Surge.sh
# - Any web hosting provider
```

### Option 2: Docker Deployment
```dockerfile
# Create Dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🔧 Environment Variables Setup

For any deployment method, you'll need these environment variables:

### Frontend (.env)
```env
VITE_CONVEX_URL=https://your-deployment.convex.cloud
GEMINI_API_KEY=your_gemini_api_key
```

### Convex Backend
```bash
# Deploy Convex to production
npx convex deploy --prod

# This will give you a production URL like:
# https://your-app-123.convex.cloud
```

## 🌍 Global CDN and Performance

### For Vercel (Automatic)
- Global CDN included
- Automatic HTTPS
- Edge functions support

### For Other Platforms
Consider adding:
- Cloudflare (free CDN)
- AWS CloudFront
- Firebase Hosting (includes CDN)

## 🔒 Security Considerations

1. **Environment Variables**: Never commit API keys to Git
2. **HTTPS**: Ensure your deployment uses HTTPS
3. **CORS**: Configure Convex for your domain
4. **Rate Limiting**: Monitor API usage

## 📊 Post-Deployment Checklist

- [ ] Frontend loads correctly
- [ ] Authentication works (Google OAuth)
- [ ] Database operations function
- [ ] MVP generation works
- [ ] Admin/SuperAdmin dashboards accessible
- [ ] Mobile responsiveness
- [ ] Performance optimization

## 🚨 Troubleshooting

### Common Issues:

1. **404 on refresh**: Add proper routing configuration
2. **Environment variables not loading**: Check naming (VITE_ prefix required)
3. **Convex connection fails**: Verify VITE_CONVEX_URL is correct
4. **Build fails**: Check all dependencies are in package.json

### Debug Commands:
```bash
# Test build locally
npm run build
npm run preview

# Check environment variables
echo $VITE_CONVEX_URL

# Verify Convex deployment
npx convex dev --once
```

## 📈 Recommended Deployment Flow

1. **Start with Vercel** (easiest, best performance)
2. **Use Convex production deployment**
3. **Configure custom domain** (optional)
4. **Set up monitoring** (Vercel Analytics)
5. **Optimize for performance**

## 🎯 Next Steps After Deployment

1. **Custom Domain**: Point your domain to the deployment
2. **Analytics**: Add Google Analytics or Vercel Analytics
3. **Monitoring**: Set up error tracking (Sentry)
4. **SEO**: Add meta tags and OpenGraph data
5. **Performance**: Optimize images and code splitting

Your application will be globally accessible and highly performant! 🌟