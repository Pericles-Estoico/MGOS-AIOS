#!/bin/bash

# ============================================================================
# NEXO Marketplace Orchestration - Integration Test Suite
# Tests complete flow of NEXO master orchestrator with all 6 agents
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_BASE="${API_BASE:-http://localhost:3000}"
ADMIN_USER="${ADMIN_USER:-pericles@vidadeceo.com.br}"
ADMIN_PASS="${ADMIN_PASS:-Estoico123@}"
TEST_TIMEOUT=30

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   NEXO MARKETPLACE ORCHESTRATION - INTEGRATION TESTS     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "📍 API Base: $API_BASE"
echo "👤 Admin User: $ADMIN_USER"
echo ""

# Counters
TESTS_PASSED=0
TESTS_FAILED=0

# ============================================================================
# Test Helper Functions
# ============================================================================

test_step() {
  echo -e "${YELLOW}▶ Test $1: $2${NC}"
}

success() {
  echo -e "${GREEN}✅ $1${NC}"
  ((TESTS_PASSED++))
}

failure() {
  echo -e "${RED}❌ $1${NC}"
  ((TESTS_FAILED++))
}

# ============================================================================
# TEST 1: Health Check
# ============================================================================

test_step "1" "Health Check - Verify API is responding"

RESPONSE=$(curl -s -w "\n%{http_code}" "$API_BASE/api/health-check")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
  success "Health check passed (HTTP 200)"
  echo "  Response: $(echo $BODY | jq -r '.message' 2>/dev/null || echo $BODY)"
else
  failure "Health check failed (HTTP $HTTP_CODE)"
  echo "  Response: $BODY"
fi

# ============================================================================
# TEST 2: Authentication
# ============================================================================

test_step "2" "Authentication - Get NextAuth session"

SESSION=$(curl -s "$API_BASE/api/auth/session")

if echo "$SESSION" | jq . > /dev/null 2>&1; then
  USER=$(echo "$SESSION" | jq -r '.user.email' 2>/dev/null)
  if [ "$USER" != "null" ] && [ ! -z "$USER" ]; then
    success "Authentication working (logged in as: $USER)"
  else
    failure "Not authenticated (anonymous session)"
  fi
else
  failure "Invalid response format from /api/auth/session"
fi

# ============================================================================
# TEST 3: Get Orchestration Status (Before Activation)
# ============================================================================

test_step "3" "Get Orchestration Status - Before activation"

RESPONSE=$(curl -s -w "\n%{http_code}" "$API_BASE/api/marketplace/orchestration/status")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
  AGENTS=$(echo "$BODY" | jq -r '.summary.totalAgents' 2>/dev/null)
  ACTIVE=$(echo "$BODY" | jq -r '.summary.activeAgents' 2>/dev/null)

  if [ ! -z "$AGENTS" ]; then
    success "Status endpoint working - $AGENTS agents found, $ACTIVE active"
  else
    failure "Status endpoint returned invalid format"
  fi
else
  failure "Status endpoint failed (HTTP $HTTP_CODE)"
  echo "  Response: $BODY"
fi

# ============================================================================
# TEST 4: Activate NEXO Orchestration
# ============================================================================

test_step "4" "Activate NEXO Orchestration"

PAYLOAD=$(cat <<EOF
{
  "channels": ["amazon", "mercadolivre", "shopee"]
}
EOF
)

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  "$API_BASE/api/marketplace/orchestration/activate")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
  PLAN_ID=$(echo "$BODY" | jq -r '.plan.planId' 2>/dev/null)
  TASKS_GEN=$(echo "$BODY" | jq -r '.plan.totalTasksGenerated' 2>/dev/null)

  if [ ! -z "$PLAN_ID" ]; then
    success "Orchestration activated - Plan ID: $PLAN_ID, Tasks generated: $TASKS_GEN"
  else
    failure "Response missing planId"
  fi
elif [ "$HTTP_CODE" = "401" ]; then
  failure "Activation failed - Not authenticated (HTTP 401)"
  echo "  Hint: Check if you're logged in to the dashboard"
elif [ "$HTTP_CODE" = "403" ]; then
  failure "Activation failed - Insufficient permissions (HTTP 403)"
  echo "  Hint: Only admin/head can activate orchestration"
else
  failure "Activation failed (HTTP $HTTP_CODE)"
  echo "  Response: $BODY"
fi

# ============================================================================
# TEST 5: Get Orchestration Status (After Activation)
# ============================================================================

test_step "5" "Get Orchestration Status - After activation"

RESPONSE=$(curl -s -w "\n%{http_code}" "$API_BASE/api/marketplace/orchestration/status")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
  TOTAL_TASKS=$(echo "$BODY" | jq -r '.summary.totalTasksGenerated' 2>/dev/null)
  ACTIVE_AGENTS=$(echo "$BODY" | jq -r '.summary.activeAgents' 2>/dev/null)
  SUCCESS_RATE=$(echo "$BODY" | jq -r '.summary.overallSuccessRate' 2>/dev/null)

  if [ ! -z "$TOTAL_TASKS" ]; then
    success "Status updated - $TOTAL_TASKS tasks, $ACTIVE_AGENTS agents active, $SUCCESS_RATE% success rate"
  else
    failure "Status response missing summary data"
  fi
else
  failure "Status endpoint failed (HTTP $HTTP_CODE)"
fi

# ============================================================================
# TEST 6: Get Performance Metrics - System-wide
# ============================================================================

test_step "6" "Get Performance Metrics - System-wide"

RESPONSE=$(curl -s -w "\n%{http_code}" "$API_BASE/api/marketplace/orchestration/metrics")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
  SYSTEM_HEALTH=$(echo "$BODY" | jq -r '.system.systemHealth' 2>/dev/null)
  NUM_AGENTS=$(echo "$BODY" | jq '.agents | length' 2>/dev/null)

  if [ ! -z "$SYSTEM_HEALTH" ] && [ ! -z "$NUM_AGENTS" ]; then
    success "System metrics retrieved - Health: $SYSTEM_HEALTH, Agents: $NUM_AGENTS"
  else
    failure "Metrics response missing data"
  fi
else
  failure "Metrics endpoint failed (HTTP $HTTP_CODE)"
  echo "  Response: $BODY"
fi

# ============================================================================
# TEST 7: Get Performance Metrics - By Agent
# ============================================================================

test_step "7" "Get Performance Metrics - By agent (alex)"

RESPONSE=$(curl -s -w "\n%{http_code}" "$API_BASE/api/marketplace/orchestration/metrics?agent=alex")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
  AGENT_NAME=$(echo "$BODY" | jq -r '.metrics.agentName' 2>/dev/null)
  SCORE=$(echo "$BODY" | jq -r '.metrics.performanceScore' 2>/dev/null)

  if [ ! -z "$AGENT_NAME" ]; then
    success "Agent metrics retrieved - $AGENT_NAME, Score: $SCORE/100"
  else
    failure "Agent metrics response invalid"
  fi
else
  failure "Agent metrics endpoint failed (HTTP $HTTP_CODE)"
fi

# ============================================================================
# TEST 8: Get Performance Metrics - By Channel
# ============================================================================

test_step "8" "Get Performance Metrics - By channel (amazon)"

RESPONSE=$(curl -s -w "\n%{http_code}" "$API_BASE/api/marketplace/orchestration/metrics?channel=amazon")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
  CHANNEL=$(echo "$BODY" | jq -r '.metrics.channel' 2>/dev/null)
  COMPLETION=$(echo "$BODY" | jq -r '.metrics.completionRate' 2>/dev/null)

  if [ ! -z "$CHANNEL" ]; then
    success "Channel metrics retrieved - $CHANNEL, Completion rate: $COMPLETION%"
  else
    failure "Channel metrics response invalid"
  fi
else
  failure "Channel metrics endpoint failed (HTTP $HTTP_CODE)"
fi

# ============================================================================
# Test Summary
# ============================================================================

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                      TEST SUMMARY                         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"

TOTAL=$((TESTS_PASSED + TESTS_FAILED))
PASS_RATE=$((TESTS_PASSED * 100 / TOTAL))

echo -e "Total Tests:  $TOTAL"
echo -e "${GREEN}Passed:       $TESTS_PASSED${NC}"
echo -e "${RED}Failed:       $TESTS_FAILED${NC}"
echo -e "Success Rate: ${PASS_RATE}%"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ ALL TESTS PASSED${NC}"
  exit 0
else
  echo -e "${RED}❌ SOME TESTS FAILED${NC}"
  exit 1
fi
