# 📋 Deployment Quick Reference

Quick commands and links for deploying the MVP Generator.

## 🚀 One-Command Deploys

```bash
# First time setup
./setup-deployment.sh

# Validate before deploying  
npm run deploy:check

# Deploy to Vercel
npm run deploy:vercel

# Deploy to Netlify
npm run deploy:netlify

# Deploy Convex backend
npm run deploy:convex
```

## 🔗 Important Links

| Resource | URL |
|----------|-----|
| **Production Site** | [Vercel Deployment](https://genai-potrl6f99-sailikhith816-5622s-projects.vercel.app) |
| **GitHub Actions** | [Workflows](https://github.com/likhith816/mvp-generator/actions) |
| **Repository** | [GitHub](https://github.com/likhith816/mvp-generator) |

## ⚙️ Environment Variables

Copy and fill these in your deployment platform:

```env
# Required
VITE_CONVEX_URL=https://your-deployment.convex.cloud
GEMINI_API_KEY=your_gemini_api_key

# Optional
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

## 📝 Common Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `./check-deployment.sh` | Validate deployment config |
| `./setup-deployment.sh` | First-time setup wizard |

## 🔄 Git Workflow

```bash
# Make changes
git add .
git commit -m "Your message"

# Deploy (push to main)
git push origin main

# Check deployment status
# Visit: https://github.com/likhith816/mvp-generator/actions
```

## 🌐 Platform-Specific

### Vercel
```bash
npm i -g vercel
npm run build
vercel --prod
```

### Netlify  
```bash
npm i -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

### GitHub Pages
- Push to main branch
- Automated via GitHub Actions

## 🔍 Health Check

```bash
# Quick validation
./check-deployment.sh

# Full test
npm run build && npm run preview
# Visit http://localhost:4173
```

## 📚 Documentation

| Guide | Purpose |
|-------|---------|
| [README.md](./README.md) | Project overview |
| [DEPLOYMENT_SETUP.md](./DEPLOYMENT_SETUP.md) | Automated deployment |
| [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) | Detailed deployment |
| [DEPLOYMENT_STATUS.md](./DEPLOYMENT_STATUS.md) | CI/CD status |
| [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) | Quick reference |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Problem solving |

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Build fails | `rm -rf node_modules && npm install` |
| Blank page | Check environment variables |
| 404 errors | Configure SPA routing |
| Actions not running | Check workflow file & branch |

## 🎯 Deploy Checklist

- [ ] Environment variables set
- [ ] Convex backend deployed
- [ ] Build succeeds locally
- [ ] Changes committed and pushed
- [ ] Deployment platform configured

## 🏆 Success Indicators

✅ Build completes without errors  
✅ Site loads and renders correctly  
✅ Authentication works  
✅ API calls succeed  
✅ Mobile responsive

---

**Quick Start**: Run `./setup-deployment.sh` for guided setup  
**Need Help**: Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
