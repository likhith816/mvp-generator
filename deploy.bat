@echo off
REM 🚀 Quick Deployment Script for MVP Generator (Windows)
echo 🚀 Starting deployment process...

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found. Make sure you're in the project root directory.
    exit /b 1
)

REM Step 1: Install dependencies
echo 📦 Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ npm install failed!
    exit /b 1
)

REM Step 2: Build the project
echo 🔨 Building the project...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed! Please check for errors.
    exit /b 1
)

REM Step 3: Deploy Convex to production
echo ☁️ Deploying Convex backend...
call npx convex deploy --prod
if %errorlevel% neq 0 (
    echo ❌ Convex deployment failed!
    exit /b 1
)

echo ✅ Build completed successfully!
echo 📁 Built files are in the 'dist' directory
echo.
echo 🌐 Next steps:
echo 1. Upload the 'dist' folder to your hosting provider, OR
echo 2. Use Vercel: 'npx vercel --prod', OR
echo 3. Use Netlify: 'npx netlify deploy --prod --dir=dist'
echo.
echo 🔧 Don't forget to set environment variables:
echo    VITE_CONVEX_URL=^<your-convex-production-url^>
echo    GEMINI_API_KEY=^<your-gemini-api-key^>

pause