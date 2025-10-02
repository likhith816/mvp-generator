#!/bin/bash

# 🚀 Quick Start Deployment Setup
# This script helps you set up deployment for the first time

echo "🚀 MVP Generator - Deployment Setup Wizard"
echo "==========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}Initializing git repository...${NC}"
    git init
    echo -e "${GREEN}✓${NC} Git initialized"
fi

# Check for remote
if ! git remote | grep -q "origin"; then
    echo ""
    echo -e "${BLUE}No git remote found.${NC}"
    echo "Please enter your GitHub repository URL (or press Enter to skip):"
    read -r REPO_URL
    
    if [ -n "$REPO_URL" ]; then
        git remote add origin "$REPO_URL"
        echo -e "${GREEN}✓${NC} Git remote added"
    else
        echo -e "${YELLOW}⚠${NC} Skipped git remote setup"
    fi
fi

# Check for environment variables
echo ""
echo "Checking environment configuration..."

if [ ! -f ".env.local" ] && [ ! -f ".env" ]; then
    echo -e "${YELLOW}No environment file found.${NC}"
    echo "Creating .env.local file..."
    
    cat > .env.local << 'EOF'
# MVP Generator Environment Variables
# Replace the placeholder values with your actual credentials

# Required: Convex Backend URL
# Get this from: npx convex deploy --prod
VITE_CONVEX_URL=https://your-deployment.convex.cloud

# Required: Gemini AI API Key  
# Get this from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key

# Optional: Google OAuth Client ID
# Get this from: https://console.cloud.google.com/
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id

# Optional: Payment Gateway Keys
VITE_RAZORPAY_KEY_ID=your_razorpay_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
EOF
    
    echo -e "${GREEN}✓${NC} Created .env.local file"
    echo -e "${YELLOW}⚠${NC} Please edit .env.local and add your actual API keys"
else
    echo -e "${GREEN}✓${NC} Environment file exists"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo ""
    echo "Installing dependencies..."
    npm install
    echo -e "${GREEN}✓${NC} Dependencies installed"
else
    echo -e "${GREEN}✓${NC} Dependencies already installed"
fi

# Test build
echo ""
echo "Testing build process..."
if npm run build > /tmp/setup-build.log 2>&1; then
    echo -e "${GREEN}✓${NC} Build successful"
else
    echo -e "${YELLOW}⚠${NC} Build failed. This may be due to missing environment variables."
    echo "   Edit .env.local with your credentials and run 'npm run build' again"
fi

# Deployment options
echo ""
echo "═══════════════════════════════════════════"
echo -e "${GREEN}Setup complete!${NC}"
echo ""
echo "Next steps:"
echo ""
echo "1. Configure environment variables:"
echo "   Edit .env.local with your actual API keys"
echo ""
echo "2. Deploy Convex backend:"
echo "   npx convex deploy --prod"
echo ""
echo "3. Choose a deployment method:"
echo ""
echo "   ${BLUE}a) GitHub Actions (Automated)${NC}"
echo "      - Push to main branch"
echo "      - Add secrets in GitHub Settings"
echo "      - Workflow will auto-deploy"
echo ""
echo "   ${BLUE}b) Vercel (Recommended)${NC}"
echo "      npm run deploy:vercel"
echo ""
echo "   ${BLUE}c) Netlify${NC}"
echo "      npm run deploy:netlify"
echo ""
echo "   ${BLUE}d) Manual Script${NC}"
echo "      ./deploy.sh"
echo ""
echo "4. Validate your setup:"
echo "   ./check-deployment.sh"
echo ""
echo "═══════════════════════════════════════════"
echo ""
echo "📚 Documentation:"
echo "   - DEPLOYMENT_SETUP.md - Automated deployment guide"
echo "   - DEPLOYMENT_GUIDE.md - Detailed deployment options"
echo "   - QUICK_DEPLOY.md - Quick reference guide"
echo ""
echo "🎉 Happy deploying!"
