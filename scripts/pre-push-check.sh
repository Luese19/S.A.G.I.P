#!/bin/bash
# Pre-Push Security Check for S.A.G.I.P
# Run this before pushing to GitHub to ensure no secrets are exposed

echo ""
echo "🔐 Security Check - Scanning for exposed secrets..."
echo ""

errors=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check 1: Verify .env is not staged
echo -e "${YELLOW}✓ Checking if .env is staged...${NC}"
if git diff --cached --name-only | grep -q "^\.env$"; then
    echo -e "  ${RED}❌ ERROR: .env file is staged for commit!${NC}"
    echo -e "  ${RED}Run: git restore --staged .env${NC}"
    ((errors++))
else
    echo -e "  ${GREEN}✓ .env is not staged${NC}"
fi

# Check 2: Verify .env is in .gitignore
echo -e "\n${YELLOW}✓ Checking .gitignore...${NC}"
if grep -q "^\.env$" .gitignore; then
    echo -e "  ${GREEN}✓ .env is in .gitignore${NC}"
else
    echo -e "  ${RED}❌ ERROR: .env is NOT in .gitignore!${NC}"
    ((errors++))
fi

# Check 3: Search for Firebase API keys in staged files
echo -e "\n${YELLOW}✓ Scanning staged files for Firebase API keys...${NC}"
foundKeys=false

for file in $(git diff --cached --name-only); do
    if [ -f "$file" ]; then
        if grep -qE "AIzaSy[a-zA-Z0-9_-]{33}" "$file"; then
            echo -e "  ${RED}❌ ERROR: Firebase API key found in $file${NC}"
            foundKeys=true
            ((errors++))
        fi
    fi
done

if [ "$foundKeys" = false ]; then
    echo -e "  ${GREEN}✓ No API keys found in staged files${NC}"
fi

# Check 4: Verify google-services.json is not staged
echo -e "\n${YELLOW}✓ Checking for google-services.json...${NC}"
if git diff --cached --name-only | grep -q "google-services\.json$"; then
    echo -e "  ${RED}❌ ERROR: google-services.json is staged for commit!${NC}"
    echo -e "  ${RED}Run: git restore --staged google-services.json${NC}"
    ((errors++))
else
    echo -e "  ${GREEN}✓ google-services.json is not staged${NC}"
fi

# Check 5: Verify .env.template or .env.example exists
echo -e "\n${YELLOW}✓ Checking for environment template...${NC}"
if [ -f ".env.template" ] || [ -f ".env.example" ]; then
    echo -e "  ${GREEN}✓ Environment template file exists${NC}"
else
    echo -e "  ${YELLOW}⚠️  WARNING: No .env.template or .env.example found${NC}"
    echo -e "  ${YELLOW}Consider adding one for new contributors${NC}"
fi

# Summary
echo ""
echo "============================================================"
if [ $errors -eq 0 ]; then
    echo -e "${GREEN}✅ All security checks passed! Safe to push.${NC}"
    echo ""
    echo -e "${CYAN}You can now run: git push${NC}"
else
    echo -e "${RED}❌ Found $errors security issue(s)! DO NOT PUSH!${NC}"
    echo ""
    echo -e "${YELLOW}Fix the issues above before pushing to GitHub.${NC}"
    echo -e "${YELLOW}See SECURITY.md for detailed guidelines.${NC}"
fi
echo "============================================================"
echo ""

exit $errors
