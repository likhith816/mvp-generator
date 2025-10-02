#!/bin/bash

# 🔍 Deployment Configuration Checker
# This script validates your deployment setup before deploying

echo "🔍 Checking deployment configuration..."
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Check if package.json exists
if [ -f "package.json" ]; then
    echo -e "${GREEN}✓${NC} package.json found"
else
    echo -e "${RED}✗${NC} package.json not found"
    ERRORS=$((ERRORS + 1))
fi

# Check if node_modules exists
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} Dependencies installed"
else
    echo -e "${YELLOW}⚠${NC} Dependencies not installed. Run 'npm install'"
    WARNINGS=$((WARNINGS + 1))
fi

# Check for required configuration files
echo ""
echo "Checking configuration files..."

if [ -f "vercel.json" ]; then
    echo -e "${GREEN}✓${NC} vercel.json configured"
else
    echo -e "${YELLOW}⚠${NC} vercel.json not found (optional for Vercel)"
    WARNINGS=$((WARNINGS + 1))
fi

if [ -f "netlify.toml" ]; then
    echo -e "${GREEN}✓${NC} netlify.toml configured"
else
    echo -e "${YELLOW}⚠${NC} netlify.toml not found (optional for Netlify)"
    WARNINGS=$((WARNINGS + 1))
fi

if [ -f ".github/workflows/deploy.yml" ]; then
    echo -e "${GREEN}✓${NC} GitHub Actions workflow configured"
else
    echo -e "${YELLOW}⚠${NC} GitHub Actions workflow not found"
    WARNINGS=$((WARNINGS + 1))
fi

# Check environment variables
echo ""
echo "Checking environment variables..."

if [ -f ".env.local" ] || [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} Environment file found"
    
    # Check for required variables
    if grep -q "VITE_CONVEX_URL" .env.local 2>/dev/null || grep -q "VITE_CONVEX_URL" .env 2>/dev/null; then
        echo -e "${GREEN}✓${NC} VITE_CONVEX_URL configured"
    else
        echo -e "${YELLOW}⚠${NC} VITE_CONVEX_URL not found in environment file"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    if grep -q "GEMINI_API_KEY" .env.local 2>/dev/null || grep -q "GEMINI_API_KEY" .env 2>/dev/null; then
        echo -e "${GREEN}✓${NC} GEMINI_API_KEY configured"
    else
        echo -e "${YELLOW}⚠${NC} GEMINI_API_KEY not found in environment file"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${YELLOW}⚠${NC} No environment file found (.env or .env.local)"
    echo "   Note: Environment variables can also be set in your hosting platform"
    WARNINGS=$((WARNINGS + 1))
fi

# Try to build the project
echo ""
echo "Testing build process..."

if npm run build > /tmp/build.log 2>&1; then
    echo -e "${GREEN}✓${NC} Build successful"
    
    # Check if dist directory was created
    if [ -d "dist" ]; then
        echo -e "${GREEN}✓${NC} dist/ directory created"
        
        # Check if index.html exists
        if [ -f "dist/index.html" ]; then
            echo -e "${GREEN}✓${NC} dist/index.html exists"
        else
            echo -e "${RED}✗${NC} dist/index.html not found"
            ERRORS=$((ERRORS + 1))
        fi
    else
        echo -e "${RED}✗${NC} dist/ directory not created"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}✗${NC} Build failed. Check /tmp/build.log for details"
    ERRORS=$((ERRORS + 1))
fi

# Check for deployment scripts
echo ""
echo "Checking deployment scripts..."

if [ -f "deploy.sh" ]; then
    echo -e "${GREEN}✓${NC} deploy.sh found"
    if [ -x "deploy.sh" ]; then
        echo -e "${GREEN}✓${NC} deploy.sh is executable"
    else
        echo -e "${YELLOW}⚠${NC} deploy.sh is not executable. Run 'chmod +x deploy.sh'"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${YELLOW}⚠${NC} deploy.sh not found"
    WARNINGS=$((WARNINGS + 1))
fi

# Summary
echo ""
echo "═══════════════════════════════════════════"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 All checks passed! Ready to deploy!${NC}"
    echo ""
    echo "Deployment options:"
    echo "  1. Vercel:  npm run deploy:vercel"
    echo "  2. Netlify: npm run deploy:netlify"
    echo "  3. Script:  ./deploy.sh"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ ${WARNINGS} warning(s) found. You can still deploy, but consider fixing these.${NC}"
    exit 0
else
    echo -e "${RED}✗ ${ERRORS} error(s) and ${WARNINGS} warning(s) found.${NC}"
    echo "Please fix the errors before deploying."
    exit 1
fi
