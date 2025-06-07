#!/bin/bash
# diagnose-auth-issues.sh
# A script to diagnose authentication issues in the Kaze Scheduling system

# Set terminal colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Display header
echo -e "${BOLD}==================================${NC}"
echo -e "${BOLD}Kaze Scheduling Auth Diagnosis Tool${NC}"
echo -e "${BOLD}==================================${NC}"
echo

# Check if the server is running
echo -e "${BLUE}Checking if development server is running...${NC}"
# Try to connect to the server
SERVER_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)
if [ "$SERVER_RESPONSE" == "200" ]; then
    echo -e "${GREEN}✅ Dev server appears to be running${NC}"
    SERVER_RUNNING=true
else
    echo -e "${YELLOW}⚠️ Dev server doesn't appear to be running on port 3000${NC}"
    echo -e "${YELLOW}Some tests will be skipped. Start the server with 'npm run dev'${NC}"
    SERVER_RUNNING=false
fi
echo

# STEP 1: Check environment variables
echo -e "${BLUE}${BOLD}STEP 1: Checking Environment Variables${NC}"
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✅ Found .env.local file${NC}"
    
    if grep -q "KAZE_API_TOKEN" .env.local; then
        echo -e "${GREEN}✅ KAZE_API_TOKEN is defined in .env.local${NC}"
        
        # Check token format without displaying the actual token
        TOKEN_LENGTH=$(grep "KAZE_API_TOKEN" .env.local | cut -d '=' -f2 | tr -d '"' | tr -d "'" | wc -c | xargs)
        echo -e "   Token length: ${TOKEN_LENGTH} characters"
        
        if [ $TOKEN_LENGTH -lt 30 ]; then
            echo -e "${YELLOW}⚠️ Token seems suspiciously short${NC}"
        else
            echo -e "${GREEN}✅ Token length appears reasonable${NC}"
        fi
        
        # Check for common issues
        TOKEN=$(grep "KAZE_API_TOKEN" .env.local | cut -d '=' -f2)
        if [[ $TOKEN == \"*\" || $TOKEN == \'*\' ]]; then
            echo -e "${YELLOW}⚠️ Token contains quotes which may cause issues${NC}"
        fi
        
        if [[ $TOKEN == *"Bearer "* ]]; then
            echo -e "${YELLOW}⚠️ Token contains 'Bearer ' prefix which should be removed${NC}"
        fi
        
        if [[ $TOKEN == *" "* ]]; then
            echo -e "${YELLOW}⚠️ Token contains spaces which may cause issues${NC}"
        fi
    else
        echo -e "${RED}❌ KAZE_API_TOKEN not found in .env.local${NC}"
        echo -e "   Please add your Kaze API token to .env.local:"
        echo -e "   KAZE_API_TOKEN=your_token_here"
    fi
else
    echo -e "${RED}❌ .env.local file not found${NC}"
    echo -e "   Create an .env.local file with your Kaze API token:"
    echo -e "   KAZE_API_TOKEN=your_token_here"
fi
echo

# STEP 2: Check for auth-related files
echo -e "${BLUE}${BOLD}STEP 2: Checking Auth Configuration Files${NC}"

# Check for auth utility files
FILES_TO_CHECK=(
    "./lib/kaze-token.ts"
    "./lib/client-auth.ts"
    "./lib/auth.ts"
)

for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ Found $file${NC}"
    else
        echo -e "${RED}❌ Missing $file${NC}"
    fi
done

# Check if web user authentication endpoints exist
AUTH_ENDPOINTS=(
    "./app/api/auth/login/route.ts"
    "./app/api/auth/logout/route.ts"
    "./app/api/auth/me/route.ts"
)

for endpoint in "${AUTH_ENDPOINTS[@]}"; do
    if [ -f "$endpoint" ]; then
        echo -e "${GREEN}✅ Found web auth endpoint: $endpoint${NC}"
    else
        echo -e "${RED}❌ Missing web auth endpoint: $endpoint${NC}"
    fi
done

# Check if Kaze API endpoints exist
KAZE_ENDPOINTS=(
    "./app/api/kaze/booking/route.ts"
    "./app/api/kaze/test-token/route.ts"
)

for endpoint in "${KAZE_ENDPOINTS[@]}"; do
    if [ -f "$endpoint" ]; then
        echo -e "${GREEN}✅ Found Kaze API endpoint: $endpoint${NC}"
    else
        echo -e "${RED}❌ Missing Kaze API endpoint: $endpoint${NC}"
    fi
done
echo

# STEP 3: Test authentication endpoints if server is running
if [ "$SERVER_RUNNING" == true ]; then
    echo -e "${BLUE}${BOLD}STEP 3: Testing Authentication Endpoints${NC}"
    
    # Check web auth endpoint
    echo -e "${BLUE}Testing web auth endpoint...${NC}"
    WEB_AUTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/auth/me 2>/dev/null)
    if [ "$WEB_AUTH_RESPONSE" == "401" ]; then
        echo -e "${GREEN}✅ Web auth endpoint working correctly (returns 401 when not authenticated)${NC}"
    else
        echo -e "${YELLOW}⚠️ Web auth endpoint returned unexpected status: $WEB_AUTH_RESPONSE${NC}"
    fi
    
    # Check Kaze API token test endpoint
    echo -e "${BLUE}Testing Kaze API token endpoint...${NC}"
    KAZE_TOKEN_RESPONSE=$(curl -s http://localhost:3000/api/kaze/test-token)
    if [[ $KAZE_TOKEN_RESPONSE == *"success"* ]]; then
        echo -e "${GREEN}✅ Kaze API token endpoint responding${NC}"
        
        if [[ $KAZE_TOKEN_RESPONSE == *"\"success\":true"* ]]; then
            echo -e "${GREEN}✅ Kaze API token is valid!${NC}"
        else
            echo -e "${RED}❌ Kaze API token is not valid${NC}"
            if [[ $KAZE_TOKEN_RESPONSE == *"error"* ]]; then
                ERROR_MSG=$(echo $KAZE_TOKEN_RESPONSE | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
                echo -e "   Error: $ERROR_MSG"
            fi
        fi
    else
        echo -e "${RED}❌ Kaze API token endpoint not responding correctly${NC}"
    fi
    echo
fi

# STEP 4: Provide recommendations
echo -e "${BLUE}${BOLD}STEP 4: Recommendations${NC}"
echo -e "${YELLOW}1. Make sure your KAZE_API_TOKEN is set correctly in .env.local${NC}"
echo -e "   - The token should not include quotes or 'Bearer ' prefix"
echo -e "   - The token should be a long string with no spaces"
echo -e ""
echo -e "${YELLOW}2. Remember that there are TWO separate authentication systems:${NC}"
echo -e "   - Web User Authentication - For identifying users in the web application"
echo -e "   - Kaze API Authentication - For server-to-server communication with Kaze backend"
echo -e ""
echo -e "${YELLOW}3. To debug authentication issues:${NC}"
echo -e "   - Check browser console logs for client-side auth issues"
echo -e "   - Check server console logs for API token issues"
echo -e "   - Try opening http://localhost:3000/api/kaze/test-token in your browser"
echo -e ""
echo -e "${YELLOW}4. To test the complete booking flow:${NC}"
echo -e "   - First sign in as a user on the web application"
echo -e "   - Then try creating a booking"
echo -e "   - Check both client and server logs for errors"

echo
echo -e "${BOLD}==================================${NC}"
echo -e "Diagnosis complete!"

exit 0
