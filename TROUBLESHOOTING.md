# 🔧 Deployment Troubleshooting Guide

Common issues and solutions when deploying the MVP Generator.

## 🚨 Build Issues

### Issue: Build fails with "Cannot find module" error

**Symptoms:**
```
Error: Cannot find module '@/components/...'
```

**Solutions:**
1. Clear cache and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. Check TypeScript path aliases in `tsconfig.json`
3. Verify all imports use correct paths

### Issue: Environment variables not available during build

**Symptoms:**
```
ReferenceError: process is not defined
or
undefined environment variable
```

**Solutions:**
1. Ensure variables have `VITE_` prefix for frontend:
   ```env
   VITE_CONVEX_URL=...  # ✅ Correct
   CONVEX_URL=...       # ❌ Wrong
   ```

2. Check variables are set in deployment platform:
   - Vercel: Project Settings → Environment Variables
   - Netlify: Site Settings → Environment Variables  
   - GitHub Actions: Repository Settings → Secrets

3. Rebuild after updating environment variables

### Issue: Large bundle size warning

**Symptoms:**
```
(!) Some chunks are larger than 500 kB after minification
```

**Solutions:**
1. Use dynamic imports for large dependencies:
   ```typescript
   // Instead of:
   import { LargeComponent } from './large';
   
   // Use:
   const LargeComponent = lazy(() => import('./large'));
   ```

2. Analyze bundle:
   ```bash
   npm run build -- --mode=production
   # Check dist/ folder sizes
   ```

3. Enable code splitting in vite.config.ts

## 🌐 Deployment Issues

### Issue: GitHub Actions workflow not triggering

**Symptoms:**
- Push to main but no workflow runs
- Actions tab shows no activity

**Solutions:**
1. Verify Actions is enabled:
   - Settings → Actions → General → Allow all actions

2. Check workflow file location:
   ```bash
   ls .github/workflows/deploy.yml
   ```

3. Verify branch name:
   ```bash
   git branch
   # Should show: * main
   ```

4. Check workflow syntax:
   ```bash
   # Validate YAML
   cat .github/workflows/deploy.yml
   ```

### Issue: Deployment succeeds but site is blank

**Symptoms:**
- Build completes successfully
- Site loads but shows blank page
- No errors in console

**Solutions:**
1. Check browser console for errors (F12)

2. Verify environment variables in production:
   - VITE_CONVEX_URL must be set
   - GEMINI_API_KEY must be set

3. Check base path in vite.config.ts for GitHub Pages:
   ```typescript
   export default defineConfig({
     base: '/repository-name/', // For GitHub Pages
     // or
     base: '/', // For custom domain
   })
   ```

4. Verify SPA routing is configured:
   - Vercel: check vercel.json has rewrites
   - Netlify: check netlify.toml has redirects
   - GitHub Pages: check workflow deploys correctly

### Issue: 404 on page refresh

**Symptoms:**
- Direct URLs work
- Refreshing any page shows 404

**Solutions:**
1. **For Vercel**: Ensure `vercel.json` has:
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

2. **For Netlify**: Ensure `netlify.toml` has:
   ```toml
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

3. **For GitHub Pages**: Use HashRouter instead of BrowserRouter:
   ```typescript
   // In main routing file
   import { HashRouter } from 'react-router-dom';
   ```

## 🔐 Authentication Issues

### Issue: Google OAuth not working in production

**Symptoms:**
- Login works locally
- Production shows OAuth error

**Solutions:**
1. Add production URL to Google Cloud Console:
   - APIs & Services → Credentials
   - Add authorized JavaScript origins
   - Add authorized redirect URIs

2. Update VITE_GOOGLE_CLIENT_ID for production

3. Verify domain matches exactly (no trailing slash)

### Issue: Convex connection fails

**Symptoms:**
```
Failed to connect to Convex
WebSocket connection failed
```

**Solutions:**
1. Verify VITE_CONVEX_URL is production URL:
   ```bash
   # Should be like:
   https://your-project.convex.cloud
   # NOT:
   http://localhost:3000
   ```

2. Deploy Convex backend:
   ```bash
   npx convex deploy --prod
   ```

3. Update Convex URL in deployment platform

4. Check Convex dashboard for deployment status

## 🚀 Performance Issues

### Issue: Slow initial load time

**Symptoms:**
- First load takes >3 seconds
- Large bundle size

**Solutions:**
1. Enable compression (automatic on most platforms)

2. Use code splitting:
   ```typescript
   const LazyComponent = lazy(() => import('./Component'));
   ```

3. Optimize images:
   - Use WebP format
   - Compress images before committing
   - Use CDN for large assets

4. Enable caching headers

### Issue: API rate limits exceeded

**Symptoms:**
```
429 Too Many Requests
Gemini API quota exceeded
```

**Solutions:**
1. Implement request throttling

2. Add caching for API responses

3. Check API quota in Google Cloud Console

4. Upgrade API plan if needed

## 📱 Mobile Issues

### Issue: Layout broken on mobile

**Symptoms:**
- Desktop works fine
- Mobile shows misaligned elements

**Solutions:**
1. Test with responsive design mode (F12 → Toggle device toolbar)

2. Check viewport meta tag in index.html:
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   ```

3. Verify Tailwind breakpoints

4. Test on actual devices

## 🔍 Debugging Tools

### Check Build Locally

```bash
# Build and preview
npm run build
npm run preview

# Visit http://localhost:4173
```

### Check Environment Variables

```bash
# In build
npm run build -- --debug

# Check loaded variables
echo $VITE_CONVEX_URL
```

### Check Deployment Logs

**GitHub Actions:**
- Go to Actions tab
- Click on latest workflow run
- Expand failed step for details

**Vercel:**
- Go to project dashboard
- Click on deployment
- View "Building" logs

**Netlify:**
- Go to site dashboard  
- Click "Deploys"
- View build logs

### Validate Configuration

```bash
# Run deployment checker
./check-deployment.sh

# Check workflow syntax
cat .github/workflows/deploy.yml | grep -E "^[^ ]"
```

## 📞 Getting Help

If issues persist:

1. **Check existing issues**: [GitHub Issues](https://github.com/likhith816/mvp-generator/issues)

2. **Review documentation**:
   - DEPLOYMENT_SETUP.md
   - DEPLOYMENT_GUIDE.md
   - DEPLOYMENT_STATUS.md

3. **Platform-specific docs**:
   - [Vercel Docs](https://vercel.com/docs)
   - [Netlify Docs](https://docs.netlify.com)
   - [GitHub Pages Docs](https://docs.github.com/en/pages)
   - [Convex Docs](https://docs.convex.dev)

4. **Create an issue** with:
   - Error messages
   - Build logs
   - Steps to reproduce
   - Environment details

## ✅ Pre-Deployment Checklist

Before deploying, verify:

- [ ] `npm run build` succeeds locally
- [ ] `npm run preview` works
- [ ] Environment variables are set
- [ ] Convex backend is deployed: `npx convex deploy --prod`
- [ ] API keys are valid and have quota
- [ ] Git repository is pushed to GitHub
- [ ] Deployment platform is configured
- [ ] Custom domain DNS is set (if applicable)

## 🎯 Quick Fixes

| Issue | Quick Fix |
|-------|-----------|
| Build fails | `rm -rf node_modules && npm install` |
| Blank page | Check environment variables |
| 404 on refresh | Configure SPA rewrites |
| OAuth fails | Add production URL to OAuth config |
| Slow load | Enable compression, use code splitting |
| API errors | Verify API keys and quotas |

---

**Last Updated**: Comprehensive deployment troubleshooting guide
**Need Help?**: Create an issue or check documentation
