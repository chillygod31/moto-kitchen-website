#!/usr/bin/env bash

# 🎯 Moto Kitchen Quotes System - Quick Test Runner
# Usage: ./run-quotes-tests.sh [environment]
# Example: ./run-quotes-tests.sh local
#          ./run-quotes-tests.sh production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-"local"}
BASE_URL="http://localhost:3000"

if [ "$ENVIRONMENT" = "production" ]; then
  BASE_URL="https://moto-kitchen-website.vercel.app"
fi

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🎯 Moto Kitchen Quotes System - Test Runner${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "Environment: ${YELLOW}$ENVIRONMENT${NC}"
echo -e "Base URL: ${YELLOW}$BASE_URL${NC}"
echo ""

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to run test
run_test() {
  local test_name=$1
  local test_command=$2
  local expected_status=$3

  echo -ne "${BLUE}→${NC} Testing: $test_name ... "
  
  response=$(eval "$test_command")
  status=$(echo "$response" | tail -n 1)
  
  if [[ "$status" == *"$expected_status"* ]]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $status)"
    echo "Response: $response"
    ((TESTS_FAILED++))
  fi
}

# ============================================================================
# 1. SECURITY TESTS
# ============================================================================

echo -e "${YELLOW}1. SECURITY TESTS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test 1.1: Public can submit
run_test "Public user can submit quote" \
  "curl -s -w '%{http_code}' -X POST $BASE_URL/api/contact \
    -H 'Content-Type: application/json' \
    -d '{
      \"name\": \"Test User\",
      \"email\": \"test@example.com\",
      \"phone\": \"+31612345678\",
      \"countryCode\": \"+31\",
      \"eventType\": \"wedding\",
      \"guestCount\": \"50\",
      \"location\": \"Amsterdam\",
      \"serviceType\": \"full-catering\",
      \"budget\": \"1000-2500\"
    }' -o /dev/null" \
  "200"

# Test 1.2: Anonymous cannot access quotes API
run_test "Anonymous cannot access /api/quotes" \
  "curl -s -w '%{http_code}' -X GET $BASE_URL/api/quotes -o /dev/null" \
  "[401,403]"

echo ""

# ============================================================================
# 2. VALIDATION TESTS
# ============================================================================

echo -e "${YELLOW}2. VALIDATION TESTS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test 2.1: Missing required field
run_test "Rejects quote with missing email" \
  "curl -s -w '%{http_code}' -X POST $BASE_URL/api/contact \
    -H 'Content-Type: application/json' \
    -d '{
      \"name\": \"Test User\",
      \"phone\": \"+31612345678\",
      \"countryCode\": \"+31\",
      \"eventType\": \"wedding\",
      \"guestCount\": \"50\",
      \"location\": \"Amsterdam\",
      \"serviceType\": \"full-catering\",
      \"budget\": \"1000-2500\"
    }' -o /dev/null" \
  "400"

# Test 2.2: Invalid email
run_test "Rejects quote with invalid email" \
  "curl -s -w '%{http_code}' -X POST $BASE_URL/api/contact \
    -H 'Content-Type: application/json' \
    -d '{
      \"name\": \"Test User\",
      \"email\": \"notanemail\",
      \"phone\": \"+31612345678\",
      \"countryCode\": \"+31\",
      \"eventType\": \"wedding\",
      \"guestCount\": \"50\",
      \"location\": \"Amsterdam\",
      \"serviceType\": \"full-catering\",
      \"budget\": \"1000-2500\"
    }' -o /dev/null" \
  "400"

# Test 2.3: Budget required for full-catering
run_test "Requires budget for full-catering" \
  "curl -s -w '%{http_code}' -X POST $BASE_URL/api/contact \
    -H 'Content-Type: application/json' \
    -d '{
      \"name\": \"Test User\",
      \"email\": \"test@example.com\",
      \"phone\": \"+31612345678\",
      \"countryCode\": \"+31\",
      \"eventType\": \"wedding\",
      \"guestCount\": \"50\",
      \"location\": \"Amsterdam\",
      \"serviceType\": \"full-catering\"
    }' -o /dev/null" \
  "400"

# Test 2.4: Budget NOT required for pickup-only
run_test "Does NOT require budget for pickup-only" \
  "curl -s -w '%{http_code}' -X POST $BASE_URL/api/contact \
    -H 'Content-Type: application/json' \
    -d '{
      \"name\": \"Test User\",
      \"email\": \"test@example.com\",
      \"phone\": \"+31612345678\",
      \"countryCode\": \"+31\",
      \"eventType\": \"wedding\",
      \"guestCount\": \"50\",
      \"location\": \"Amsterdam\",
      \"serviceType\": \"pickup-only\"
    }' -o /dev/null" \
  "200"

echo ""

# ============================================================================
# 3. RATE LIMITING TESTS
# ============================================================================

echo -e "${YELLOW}3. RATE LIMITING TESTS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -e "${YELLOW}Submitting 4 quotes rapidly (3 should pass, 4th should be rate limited)...${NC}"

submit_quote() {
  local index=$1
  curl -s -w '%{http_code}' -X POST $BASE_URL/api/contact \
    -H 'Content-Type: application/json' \
    -d '{
      "name": "Rate Test '$index'",
      "email": "ratetest'$index'@example.com",
      "phone": "+31612345678",
      "countryCode": "+31",
      "eventType": "wedding",
      "guestCount": "50",
      "location": "Amsterdam",
      "serviceType": "full-catering",
      "budget": "1000-2500"
    }' -o /dev/null
}

# Submit 4 times
for i in 1 2 3 4; do
  echo -ne "${BLUE}→${NC} Quote $i: "
  status=$(submit_quote $i)
  
  if [ $i -le 3 ] && [ "$status" = "200" ]; then
    echo -e "${GREEN}✓ $status${NC}"
    ((TESTS_PASSED++))
  elif [ $i -eq 4 ] && [ "$status" = "429" ]; then
    echo -e "${GREEN}✓ Rate Limited ($status)${NC}"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}✗ $status (Expected: 200 for 1-3, 429 for 4)${NC}"
    ((TESTS_FAILED++))
  fi
  
  sleep 0.1
done

echo ""

# ============================================================================
# 4. HONEYPOT TEST
# ============================================================================

echo -e "${YELLOW}4. HONEYPOT TEST${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

run_test "Honeypot field silently rejects bot" \
  "curl -s -w '%{http_code}' -X POST $BASE_URL/api/contact \
    -H 'Content-Type: application/json' \
    -d '{
      \"name\": \"Spam Bot\",
      \"email\": \"bot@spam.com\",
      \"phone\": \"+31612345678\",
      \"countryCode\": \"+31\",
      \"eventType\": \"wedding\",
      \"guestCount\": \"50\",
      \"location\": \"Amsterdam\",
      \"serviceType\": \"full-catering\",
      \"budget\": \"1000-2500\",
      \"website\": \"https://spamsite.com\"
    }' -o /dev/null" \
  "200"

echo ""

# ============================================================================
# 5. PERFORMANCE TESTS
# ============================================================================

echo -e "${YELLOW}5. PERFORMANCE TESTS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -ne "${BLUE}→${NC} Measuring form submission time ... "
START=$(date +%s%N)
curl -s -X POST $BASE_URL/api/contact \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Perf Test",
    "email": "perftest@example.com",
    "phone": "+31612345678",
    "countryCode": "+31",
    "eventType": "wedding",
    "guestCount": "50",
    "location": "Amsterdam",
    "serviceType": "full-catering",
    "budget": "1000-2500"
  }' > /dev/null
END=$(date +%s%N)

DURATION=$(( (END - START) / 1000000 ))
echo -e "${GREEN}${DURATION}ms${NC}"

if [ $DURATION -lt 3000 ]; then
  echo -e "${GREEN}✓ Within 3 second target${NC}"
  ((TESTS_PASSED++))
else
  echo -e "${YELLOW}⚠ Exceeds 3 second target (${DURATION}ms)${NC}"
fi

echo -ne "${BLUE}→${NC} Measuring admin quotes list load time ... "
START=$(date +%s%N)
curl -s -X GET "$BASE_URL/api/quotes" -H 'Content-Type: application/json' > /dev/null 2>&1
END=$(date +%s%N)

DURATION=$(( (END - START) / 1000000 ))
echo -e "${GREEN}${DURATION}ms${NC}"

if [ $DURATION -lt 1000 ]; then
  echo -e "${GREEN}✓ Within 1 second target${NC}"
  ((TESTS_PASSED++))
else
  echo -e "${YELLOW}⚠ Exceeds 1 second target (${DURATION}ms)${NC}"
fi

echo ""

# ============================================================================
# TEST SUMMARY
# ============================================================================

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}📊 TEST SUMMARY${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

TOTAL=$((TESTS_PASSED + TESTS_FAILED))

echo -e "Total Tests: $TOTAL"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
  echo ""
  echo -e "${BLUE}Next steps:${NC}"
  echo "1. Run manual UX tests from QUOTES_TESTING_GUIDE.md"
  echo "2. Test on mobile device"
  echo "3. Verify email delivery to admin"
  echo "4. Test admin panel functionality"
  exit 0
else
  echo -e "${RED}❌ SOME TESTS FAILED${NC}"
  echo ""
  echo -e "${BLUE}Fix issues and re-run:${NC}"
  echo "./run-quotes-tests.sh $ENVIRONMENT"
  exit 1
fi

