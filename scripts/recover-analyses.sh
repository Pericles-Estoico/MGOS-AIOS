#!/bin/bash

##############################################################################
# Marketplace Analysis Recovery Script
# Reprocesses stuck marketplace analyses that haven't created Phase 1 tasks
# Usage: bash scripts/recover-analyses.sh [options]
##############################################################################

set -e

# Configuration
ENVIRONMENT="${ENVIRONMENT:-production}"
ACTION="${1:-list}"
PLAN_IDS="${2:-}"
RETRY_COUNT=0
MAX_RETRIES=3
RETRY_DELAY=5

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
    exit 1
    ;;
esac

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Helper functions
print_header() {
  echo ""
  echo "=========================================="
  echo "🔄 Marketplace Analysis Recovery"
  echo "=========================================="
  echo "Environment: $ENVIRONMENT"
  echo "Base URL: $BASE_URL"
  echo "Action: $ACTION"
  echo ""
}

print_usage() {
  cat << EOF
${BLUE}Usage:${NC}
  bash scripts/recover-analyses.sh [action] [plan-ids]

${BLUE}Actions:${NC}
  list                    List all stuck analyses (default)
  reprocess-all          Reprocess all stuck analyses
  reprocess <id> [id]... Reprocess specific analyses

${BLUE}Examples:${NC}
  # List stuck analyses
  bash scripts/recover-analyses.sh list

  # Reprocess all
  bash scripts/recover-analyses.sh reprocess-all

  # Reprocess specific analyses
  bash scripts/recover-analyses.sh reprocess plan-123 plan-456

${BLUE}Environment Variables:${NC}
  ENVIRONMENT  Set to: prod, staging, dev (default: production)

${BLUE}Example:${NC}
  ENVIRONMENT=staging bash scripts/recover-analyses.sh reprocess-all

EOF
}

# Make request with retry logic
make_request() {
  local action=$1
  local data=$2
  local attempt=1

  while [ $attempt -le $MAX_RETRIES ]; do
    echo -e "${CYAN}📤 Request (attempt $attempt/$MAX_RETRIES)${NC}"

    response=$(curl -s -w "\n%{http_code}" \
      -X POST \
      -H "Content-Type: application/json" \
      -d "$data" \
      "$BASE_URL/api/admin/marketplace/recovery" 2>&1)

    http_code=$(echo "$response" | tail -1)
    body=$(echo "$response" | head -n -1)

    echo "   HTTP Status: $http_code"

    # Check if successful (2xx or 3xx)
    if [[ "$http_code" =~ ^[23] ]]; then
      echo -e "${GREEN}✅ Request successful${NC}"
      echo ""
      echo -e "${BLUE}📋 Response:${NC}"
      echo "$body" | jq . 2>/dev/null || echo "$body"
      return 0
    fi

    # If not successful and not last attempt, retry
    if [ $attempt -lt $MAX_RETRIES ]; then
      echo -e "${YELLOW}⏳ Retrying in ${RETRY_DELAY}s...${NC}"
      sleep $RETRY_DELAY
    fi

    attempt=$((attempt + 1))
  done

  # Failed after all retries
  echo -e "${RED}❌ Request failed after $MAX_RETRIES attempts${NC}"
  echo "Response: $body"
  return 1
}

# Main logic
case "$ACTION" in
  help|-h|--help)
    print_usage
    exit 0
    ;;

  list)
    print_header
    echo -e "${YELLOW}📍 Listing stuck marketplace analyses...${NC}"
    echo ""

    data='{"action":"list"}'
    make_request "list" "$data"

    echo ""
    echo -e "${CYAN}💡 To reprocess all stuck analyses, run:${NC}"
    echo "  bash scripts/recover-analyses.sh reprocess-all"
    echo ""
    ;;

  reprocess-all)
    print_header
    echo -e "${YELLOW}⚠️  This will reprocess ALL stuck marketplace analyses${NC}"
    echo -e "${YELLOW}This may take 5-30 minutes depending on queue size${NC}"
    echo ""

    # Confirmation
    read -p "Continue? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      echo "Cancelled."
      exit 0
    fi

    echo ""
    echo -e "${BLUE}🚀 Starting recovery of all analyses...${NC}"
    echo ""

    data='{"action":"reprocess-all"}'
    if make_request "reprocess-all" "$data"; then
      echo ""
      echo -e "${GREEN}✅ Recovery initiated!${NC}"
      echo ""
      echo "📊 Job Details:"
      echo "  - All stuck analyses queued for reprocessing"
      echo "  - Phase 1 tasks will be created automatically"
      echo "  - This typically takes 15-30 minutes"
      echo ""
      echo "🔍 To monitor progress:"
      echo "  1. Check Vercel logs: https://vercel.com/dashboard"
      echo "  2. Look for: '🔄 Processing job...' and '✅ Job completed'"
      echo "  3. Or run: bash scripts/test-queue-recovery.sh $ENVIRONMENT"
      echo ""
      echo "✅ When complete:"
      echo "  - All 24+ analyses will have Phase 1 tasks"
      echo "  - Run: bash scripts/recover-analyses.sh list"
      echo "  - Should show: stuckCount: 0"
    else
      echo -e "${RED}Recovery failed. Check logs above.${NC}"
      exit 1
    fi
    ;;

  reprocess)
    if [ -z "$PLAN_IDS" ]; then
      echo -e "${RED}❌ No plan IDs provided${NC}"
      print_usage
      exit 1
    fi

    print_header

    # Convert plan IDs to JSON array
    ids_json=$(echo "$PLAN_IDS" | jq -R 'split(" ") | map(select(length > 0))' -s)

    echo -e "${YELLOW}📍 Reprocessing specific analyses...${NC}"
    echo "Plan IDs: $ids_json"
    echo ""

    data="{\"action\":\"reprocess\",\"planIds\":$ids_json}"

    if make_request "reprocess" "$data"; then
      echo ""
      echo -e "${GREEN}✅ Reprocessing started!${NC}"
      echo ""
      echo "💾 Phase 1 tasks will be created for these analyses"
      echo "⏱️  Check progress in Vercel logs"
    else
      echo -e "${RED}Reprocessing failed.${NC}"
      exit 1
    fi
    ;;

  *)
    echo -e "${RED}❌ Unknown action: $ACTION${NC}"
    print_usage
    exit 1
    ;;
esac

echo ""
echo "=========================================="
echo "✅ Done"
echo "=========================================="
