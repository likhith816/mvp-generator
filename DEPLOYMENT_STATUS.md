# 🔄 CI/CD & Deployment Status

## Current Deployment Configuration

### Automated Workflows

| Workflow | Status | Description |
|----------|--------|-------------|
| Build and Deploy | ![Build Status](https://github.com/likhith816/mvp-generator/actions/workflows/deploy.yml/badge.svg) | Automated build and deployment on push to main |

### Deployment Targets

| Platform | Status | URL | Auto-Deploy |
|----------|--------|-----|-------------|
| **Production (Vercel)** | 🟢 Live | [genai-potrl6f99...vercel.app](https://genai-potrl6f99-sailikhith816-5622s-projects.vercel.app) | ⚙️ Optional |
| **GitHub Pages** | ⚙️ Configured | Set up in Actions | ✅ Yes |
| **Preview Builds** | ✅ Enabled | On pull requests | ✅ Yes |

## 🚦 Build Pipeline

The automated deployment pipeline consists of:

### 1. Build Job
- ✅ Checkout code
- ✅ Install dependencies (`npm ci`)
- ✅ Build application (`npm run build`)
- ✅ Upload artifacts (dist/)

### 2. Deploy to Vercel (Optional)
- ⚙️ Requires: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- 📦 Deploys to production on main branch
- 🔄 Creates preview deployments on PRs

### 3. Deploy to GitHub Pages
- ✅ Automatic on main branch push
- 🌐 Serves static site from gh-pages branch
- 🔒 HTTPS enabled by default

## 📊 Recent Deployments

View deployment history:
- [GitHub Actions History](https://github.com/likhith816/mvp-generator/actions)
- [Commit History](https://github.com/likhith816/mvp-generator/commits)

## ⚙️ Configuration

### Required Secrets (GitHub Actions)

For automated deployment, add these in **Settings → Secrets and variables → Actions**:

| Secret | Required | Description |
|--------|----------|-------------|
| `VITE_CONVEX_URL` | ✅ Yes | Convex backend production URL |
| `GEMINI_API_KEY` | ✅ Yes | Google Gemini API key |
| `VERCEL_TOKEN` | ⚠️ Optional | For Vercel auto-deployment |
| `VERCEL_ORG_ID` | ⚠️ Optional | For Vercel auto-deployment |
| `VERCEL_PROJECT_ID` | ⚠️ Optional | For Vercel auto-deployment |

### Environment Variables

Production environment variables are configured in:
- GitHub Actions: Repository secrets
- Vercel: Project settings → Environment variables
- Netlify: Site settings → Environment variables

## 🔍 Health Checks

### Automated Checks

The CI/CD pipeline automatically verifies:
- ✅ Build completes without errors
- ✅ All dependencies resolve correctly
- ✅ Output includes required files (index.html, assets)
- ✅ Bundle size warnings (>500KB chunks flagged)

### Manual Validation

Run pre-deployment checks locally:
```bash
npm run deploy:check
# or
./check-deployment.sh
```

## 🐛 Troubleshooting

### Build Failures

**Symptom**: GitHub Actions workflow fails at build step

**Solutions**:
1. Check that secrets are configured correctly
2. Verify environment variable names (must have `VITE_` prefix)
3. Review build logs in Actions tab
4. Test locally: `npm run build`

### Deployment Not Triggering

**Symptom**: Push to main doesn't trigger deployment

**Solutions**:
1. Verify GitHub Actions is enabled in repository settings
2. Check workflow file exists: `.github/workflows/deploy.yml`
3. Ensure you're pushing to `main` branch (not `master`)
4. Check branch protection rules aren't blocking

### Environment Variables Not Loading

**Symptom**: App builds but fails at runtime

**Solutions**:
1. Verify secrets are named exactly as referenced in workflow
2. Check that variables are added to hosting platform
3. Ensure values don't have extra quotes or whitespace
4. Re-deploy after updating environment variables

## 📈 Performance

### Build Times

| Stage | Average Time |
|-------|--------------|
| Dependencies Install | ~15s |
| Build | ~4s |
| Deploy (Vercel) | ~10s |
| Deploy (GitHub Pages) | ~30s |
| **Total** | **~1 min** |

### Bundle Size

Current production build:
- Main bundle: ~824 KB (247 KB gzipped)
- HTML: ~2 KB (0.8 KB gzipped)

⚠️ **Note**: Consider code-splitting for chunks >500 KB

## 🎯 Optimization Tips

1. **Code Splitting**: Use dynamic imports for large dependencies
2. **Caching**: Leverage CDN caching for static assets
3. **Compression**: Gzip/Brotli compression enabled automatically
4. **Tree Shaking**: Remove unused code during build
5. **Asset Optimization**: Compress images and media files

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [Netlify CI/CD](https://docs.netlify.com/configure-builds/overview/)
- [Convex Deployment](https://docs.convex.dev/production/hosting)

## 🔔 Notifications

Set up notifications for deployment events:
1. GitHub: Watch repository → Custom → Select "Actions"
2. Slack: Install GitHub app for deployment notifications
3. Email: Configure in GitHub notification settings

---

**Last Updated**: Automated deployment configured with GitHub Actions
**Maintained By**: Repository maintainers
