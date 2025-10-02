#!/bin/bash

# 🚀 Quick Deployment Script for MVP Generator
echo "🚀 Starting deployment process..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the project root directory."
    exit 1
fi

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
npm install

# Step 2: Build the project
echo "🔨 Building the project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please check for errors."
    exit 1
fi

# Step 3: Deploy Convex to production
echo "☁️ Deploying Convex backend..."
npx convex deploy --prod

if [ $? -ne 0 ]; then
    echo "❌ Convex deployment failed!"
    exit 1
fi

echo "✅ Build completed successfully!"
echo "📁 Built files are in the 'dist' directory"
echo ""
echo "🌐 Next steps:"
echo "1. Upload the 'dist' folder to your hosting provider, OR"
echo "2. Use Vercel: 'npx vercel --prod', OR"
echo "3. Use Netlify: 'npx netlify deploy --prod --dir=dist'"
echo ""
echo "🔧 Don't forget to set environment variables:"
echo "   VITE_CONVEX_URL=<your-convex-production-url>"
echo "   GEMINI_API_KEY=<your-gemini-api-key>"