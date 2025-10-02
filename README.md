# 🚀 MVP Generator - AI-Powered Startup Tool

[![Build and Deploy](https://github.com/likhith816/mvp-generator/actions/workflows/deploy.yml/badge.svg)](https://github.com/likhith816/mvp-generator/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-18%2B-brightgreen)](https://nodejs.org/)

An intelligent MVP (Minimum Viable Product) generator that helps entrepreneurs and developers create comprehensive business plans and prototypes using AI technology.

## ✨ Features

- **🤖 AI-Powered MVP Generation** - Generate complete MVP plans using Gemini AI
- **👥 User Management** - Role-based access (User, Admin, SuperAdmin)
- **💳 Subscription System** - Free, Pro, and Enterprise plans with INR pricing
- **📊 Analytics Dashboard** - Real-time revenue tracking and user analytics
- **🔐 Secure Authentication** - Email/Password + Google OAuth integration
- **💰 Payment Integration** - Ready for Stripe, Razorpay, PayPal integration
- **🌐 Global Deployment** - Deployed on Vercel with worldwide CDN

## 🛠 Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Convex (Real-time database)
- **AI**: Google Gemini API
- **Authentication**: Google OAuth + Custom Auth
- **Styling**: Tailwind CSS
- **Deployment**: Vercel
- **Payment**: Stripe/Razorpay ready

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Convex account
- Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/likhith816/mvp-generator.git
   cd mvp-generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create `.env.local`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   VITE_CONVEX_URL=your_convex_deployment_url
   VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
   ```

4. **Deploy Convex backend**
   ```bash
   npx convex deploy
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Visit** `http://localhost:5173`

## 📦 Deployment

[![Deployment Status](https://github.com/likhith816/mvp-generator/actions/workflows/deploy.yml/badge.svg)](https://github.com/likhith816/mvp-generator/actions/workflows/deploy.yml)

> 🎉 **Ready to deploy!** See [GETTING_STARTED_DEPLOY.md](./GETTING_STARTED_DEPLOY.md) for complete setup guide.

### 🚀 Automated Deployment

This repository includes automated CI/CD workflows for seamless deployment.

**Quick Start:**
1. Push to `main` branch - automatically builds and deploys
2. Check deployment status in GitHub Actions tab
3. View live site once deployment completes

📖 **Guides:**
- [🎯 Getting Started with Deployment](./GETTING_STARTED_DEPLOY.md) - Start here!
- [⚙️ Automated Deployment Setup](./DEPLOYMENT_SETUP.md)
- [📋 Quick Reference](./DEPLOY_REFERENCE.md)
- [🔧 Troubleshooting](./TROUBLESHOOTING.md)

### Quick Deploy Commands

**Vercel:**
```bash
npm run deploy:vercel
```

**Netlify:**
```bash
npm run deploy:netlify
```

**Validation Check:**
```bash
npm run deploy:check
```

### Manual Deployment
1. Build the project: `npm run build`
2. Deploy `dist/` folder to any hosting service
3. Set environment variables on your hosting platform

📚 **More Options:** See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) and [QUICK_DEPLOY.md](./QUICK_DEPLOY.md)

## 🧪 Test Accounts

- **User**: `alice@example.com` / `alice123`
- **Admin**: `diana@example.com` / `diana123`
- **SuperAdmin**: `sailikhith816@gmail.com` / `9494532@Pl`

## 🎯 Live Demo

**Production URL**: [MVP Generator Live](https://genai-potrl6f99-sailikhith816-5622s-projects.vercel.app)

## 📊 Features Overview

### For Users
- Generate AI-powered MVP plans
- View and manage generated plans
- Subscription management
- Profile settings

### For Admins
- User management
- MVP plan oversight
- System analytics
- Access control

### For SuperAdmins
- Revenue tracking (INR)
- Subscription analytics
- System monitoring
- Admin management

## 🔧 Configuration

### Payment Integration
The app is ready for multiple payment providers:
- **Razorpay** (Recommended for India)
- **Stripe** (Global payments)
- **PayPal** (International)

### Environment Variables
```env
# Required
GEMINI_API_KEY=your_gemini_api_key
VITE_CONVEX_URL=your_convex_url

# Optional
VITE_GOOGLE_CLIENT_ID=your_google_oauth_id
VITE_RAZORPAY_KEY_ID=your_razorpay_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
```

## 📈 Revenue Model

- **Free Plan**: ₹0 - 10 API calls, 2 MVP generations
- **Pro Plan**: ₹2,500/month - 100 API calls, 20 MVP generations
- **Enterprise Plan**: ₹10,000/month - 1000 API calls, 100 MVP generations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m "Add feature"`
4. Push to branch: `git push origin feature-name`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Developer

**Likhith Sai Parepalli**
- GitHub: [@likhith816](https://github.com/likhith816)
- Email: sailikhith816@gmail.com

## 🌟 Show Your Support

Give a ⭐️ if this project helped you!

---

**Built with ❤️ using React, Convex, and AI**
