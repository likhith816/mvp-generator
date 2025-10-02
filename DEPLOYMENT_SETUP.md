# 🚀 Automated Deployment Setup

This repository is configured for automated deployment to multiple platforms.

## ✅ Deployment Status

![Build and Deploy](https://github.com/likhith816/mvp-generator/actions/workflows/deploy.yml/badge.svg)

## 🎯 Quick Deploy Options

### Option 1: Automated GitHub Actions (Recommended)

The repository includes a GitHub Actions workflow that automatically deploys on push to `main` branch.

**Setup Required:**
1. Enable GitHub Pages in repository settings
2. Add these secrets in Settings → Secrets and variables → Actions:
   - `VITE_CONVEX_URL` - Your Convex production URL
   - `GEMINI_API_KEY` - Your Gemini API key

**Optional Vercel Integration:**
3. Add these additional secrets for Vercel deployment:
   - `VERCEL_TOKEN` - Your Vercel token
   - `VERCEL_ORG_ID` - Your Vercel organization ID
   - `VERCEL_PROJECT_ID` - Your Vercel project ID

### Option 2: Manual Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
npm run deploy:vercel
```

### Option 3: Manual Netlify Deployment

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
npm run deploy:netlify
```

### Option 4: Using Deployment Scripts

**Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh
```

**Windows:**
```cmd
deploy.bat
```

## 🔍 Pre-Deployment Validation

Run the deployment checker to validate your configuration:

```bash
chmod +x check-deployment.sh
./check-deployment.sh
```

This will verify:
- ✅ All required files are present
- ✅ Dependencies are installed
- ✅ Build process works
- ✅ Environment variables are configured
- ✅ Deployment scripts are ready

## 🌐 Supported Platforms

| Platform | Auto-Deploy | Manual Deploy | Config File |
|----------|-------------|---------------|-------------|
| **GitHub Pages** | ✅ Yes | ✅ Yes | `.github/workflows/deploy.yml` |
| **Vercel** | ⚙️ Optional | ✅ Yes | `vercel.json` |
| **Netlify** | ❌ No | ✅ Yes | `netlify.toml` |
| **Docker** | ❌ No | ✅ Yes | `Dockerfile` |

## 📋 Environment Variables

All deployment methods require these environment variables:

```env
VITE_CONVEX_URL=https://your-deployment.convex.cloud
GEMINI_API_KEY=your_gemini_api_key
```

Optional:
```env
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

## 🔧 Deployment Workflow

The automated GitHub Actions workflow:

1. **Build** - Builds the application with your environment variables
2. **Test** - Validates the build output
3. **Deploy to Vercel** - (If configured) Deploys to Vercel production
4. **Deploy to GitHub Pages** - Deploys to GitHub Pages

## 📊 Post-Deployment Checklist

After deployment, verify:

- [ ] Website loads correctly
- [ ] Authentication works (Google OAuth)
- [ ] Database operations function (Convex)
- [ ] MVP generation works (Gemini AI)
- [ ] Admin/SuperAdmin dashboards accessible
- [ ] Mobile responsiveness
- [ ] HTTPS enabled
- [ ] Custom domain configured (if applicable)

## 🚨 Troubleshooting

### Build Failures

```bash
# Check logs
npm run build

# Verify dependencies
npm ci

# Test locally
npm run preview
```

### Environment Variable Issues

1. Ensure variables have the `VITE_` prefix for frontend variables
2. Check variable names match exactly (case-sensitive)
3. Verify values don't have extra quotes or spaces

### Deployment Not Triggering

1. Check GitHub Actions is enabled
2. Verify workflow file is in `.github/workflows/`
3. Ensure you're pushing to the `main` branch
4. Check repository secrets are configured

## 📚 Additional Resources

- [Detailed Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Quick Deploy Guide](./QUICK_DEPLOY.md)
- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)

## 💡 Best Practices

1. **Always test locally first**: `npm run build && npm run preview`
2. **Use environment-specific configs**: Different settings for dev/staging/prod
3. **Monitor deployments**: Check the Actions tab for build status
4. **Set up domain**: Configure custom domain after first successful deploy
5. **Enable analytics**: Add monitoring to track performance

## 🎉 Success!

Once deployed, your MVP Generator will be:
- 🌍 Globally accessible
- ⚡ Served via CDN for fast loading
- 🔒 Secured with HTTPS
- 📊 Ready for production use

**Live Demo**: [MVP Generator](https://genai-potrl6f99-sailikhith816-5622s-projects.vercel.app)
