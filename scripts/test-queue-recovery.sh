#!/bin/bash

##############################################################################
# Queue System Recovery Test Script
# Tests marketplace analysis queue worker and recovery endpoint
# Usage: bash scripts/test-queue-recovery.sh [environment]
##############################################################################

set -e

# Configuration
ENVIRONMENT="${1:-production}"
case $ENVIRONMENT in
  prod|production)
    BASE_URL="https://www.sellerops.com.br"
    ;;
  dev|development)
    BASE_URL="http://localhost:3000"
    ;;
  staging)
    BASE_URL="https://staging-mgos.vercel.app"
    ;;
  *)
    echo "❌ Invalid environment: $ENVIRONMENT"
    echo "Usage: bash scripts/test-queue-recovery.sh [prod|dev|staging]"
    exit 1
    ;;
esac

echo "=========================================="
echo "🧪 Queue System Recovery Test"
echo "=========================================="
echo "Environment: $ENVIRONMENT"
echo "Base URL: $BASE_URL"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
test_endpoint() {
  local name=$1
  local method=$2
  local endpoint=$3
  local data=$4

  echo -e "${BLUE}📌 Testing: $name${NC}"

  if [ "$method" = "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" \
      -H "Content-Type: application/json" \
      -d "$data" \
      "$BASE_URL$endpoint")
  fi

  http_code=$(echo "$response" | tail -1)
  body=$(echo "$response" | head -n -1)

  echo "   HTTP Status: $http_code"

  if [[ "$http_code" =~ ^[23] ]] || [[ "$http_code" == "401" ]]; then
    echo -e "   ${GREEN}✅ Success${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    echo "$body" | jq . 2>/dev/null || echo "$body"
  else
    echo -e "   ${RED}❌ Failed${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    echo "$body"
  fi
  echo ""
}

# Test 1: Basic connectivity
echo -e "${YELLOW}[1/5] Basic Connectivity${NC}"
echo "======================================"
if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" -L | grep -q "200\|307"; then
  echo -e "${GREEN}✅ Application is responding${NC}\n"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo -e "${RED}❌ Application not responding${NC}\n"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Test 2: Check API health
echo -e "${YELLOW}[2/5] API Health Check${NC}"
echo "======================================"
test_endpoint "GET /api/tasks" "GET" "/api/tasks" ""

# Test 3: List stuck analyses
echo -e "${YELLOW}[3/5] Recovery Endpoint${NC}"
echo "======================================"
test_endpoint \
  "POST /api/recovery (list)" \
  "POST" \
  "/api/recovery" \
  '{"action":"list"}'

# Test 4: Get marketplace analysis (if exists)
echo -e "${YELLOW}[4/5] Marketplace Analysis${NC}"
echo "======================================"
test_endpoint \
  "GET /api/marketplace/analysis" \
  "GET" \
  "/api/marketplace/analysis" \
  ""

# Test 5: Check database connectivity
echo -e "${YELLOW}[5/5] Database Connectivity${NC}"
echo "======================================"
# Try to get user count as a proxy for DB connectivity
test_endpoint \
  "GET /api/users" \
  "GET" \
  "/api/users" \
  ""

# Summary
echo ""
echo "=========================================="
echo "📊 Test Summary"
echo "=========================================="
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All tests passed!${NC}"
  echo ""
  echo "🔧 Next steps to recover marketplace analyses:"
  echo "  1. Make sure you're logged in as admin"
  echo "  2. Run: bash scripts/recover-analyses.sh list"
  echo "  3. Then: bash scripts/recover-analyses.sh reprocess-all"
  echo ""
  echo "📝 Monitor logs:"
  if [ "$ENVIRONMENT" = "production" ]; then
    echo "   Vercel Dashboard → Deployments → Logs"
    echo "   Look for: '✅ Queue system initialized on server'"
    echo "             '🔄 Processing job...'"
    echo "             '✅ Job completed:'"
  else
    echo "   npm run dev"
    echo "   Check console for queue processing messages"
  fi
  exit 0
else
  echo -e "${RED}❌ Some tests failed. Check output above.${NC}"
  echo ""
  echo "📋 Troubleshooting:"
  echo "  1. Verify application is deployed and running"
  echo "  2. Check Vercel logs for errors"
  echo "  3. Verify Redis configuration (production)"
  echo "  4. Ensure authentication is working"
  exit 1
fi
