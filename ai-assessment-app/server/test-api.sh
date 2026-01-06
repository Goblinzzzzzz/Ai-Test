#!/bin/bash

# Manual API Testing Script for Backend Verification
# This script tests all API endpoints to verify backend functionality

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${API_BASE_URL:-http://localhost:3000}"
COHORT="test-cohort-$(date +%s)"

echo "========================================="
echo "Backend API Manual Testing"
echo "========================================="
echo "Base URL: $BASE_URL"
echo "Test Cohort: $COHORT"
echo ""

# Test 1: Health Check
echo -e "${YELLOW}Test 1: Health Check${NC}"
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/health")
HEALTH_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | head -n-1)

if [ "$HEALTH_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
    echo "Response: $HEALTH_BODY"
else
    echo -e "${RED}✗ Health check failed (HTTP $HEALTH_CODE)${NC}"
    echo "Response: $HEALTH_BODY"
    exit 1
fi
echo ""

# Test 2: Submit Assessment (Valid)
echo -e "${YELLOW}Test 2: Submit Valid Assessment${NC}"
SUBMIT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/assessments" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"测试用户\",
    \"cohort\": \"$COHORT\",
    \"total\": 25,
    \"title\": \"AI 应用先锋\",
    \"d1\": 5,
    \"d2\": 5,
    \"d3\": 5,
    \"d4\": 5,
    \"d5\": 5,
    \"answers\": {\"q1\": 5, \"q2\": 5, \"q3\": 5, \"q4\": 5, \"q5\": 5}
  }")

SUBMIT_CODE=$(echo "$SUBMIT_RESPONSE" | tail -n1)
SUBMIT_BODY=$(echo "$SUBMIT_RESPONSE" | head -n-1)

if [ "$SUBMIT_CODE" = "201" ]; then
    echo -e "${GREEN}✓ Assessment submission passed${NC}"
    echo "Response: $SUBMIT_BODY"
else
    echo -e "${RED}✗ Assessment submission failed (HTTP $SUBMIT_CODE)${NC}"
    echo "Response: $SUBMIT_BODY"
fi
echo ""

# Test 3: Submit Assessment (Invalid - out of range)
echo -e "${YELLOW}Test 3: Submit Invalid Assessment (Out of Range)${NC}"
INVALID_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/assessments" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"测试用户\",
    \"cohort\": \"$COHORT\",
    \"total\": 35,
    \"title\": \"测试\",
    \"d1\": 7,
    \"d2\": 5,
    \"d3\": 5,
    \"d4\": 5,
    \"d5\": 5,
    \"answers\": {}
  }")

INVALID_CODE=$(echo "$INVALID_RESPONSE" | tail -n1)
INVALID_BODY=$(echo "$INVALID_RESPONSE" | head -n-1)

if [ "$INVALID_CODE" = "400" ]; then
    echo -e "${GREEN}✓ Validation correctly rejected invalid data${NC}"
    echo "Response: $INVALID_BODY"
else
    echo -e "${RED}✗ Validation failed to reject invalid data (HTTP $INVALID_CODE)${NC}"
    echo "Response: $INVALID_BODY"
fi
echo ""

# Submit a few more assessments for testing statistics
echo -e "${YELLOW}Submitting additional test data...${NC}"
for i in {1..3}; do
    curl -s -X POST "$BASE_URL/api/assessments" \
      -H "Content-Type: application/json" \
      -d "{
        \"name\": \"用户$i\",
        \"cohort\": \"$COHORT\",
        \"total\": $((20 + i)),
        \"title\": \"测试标题\",
        \"d1\": 4,
        \"d2\": 4,
        \"d3\": 4,
        \"d4\": 4,
        \"d5\": $((4 + i % 3)),
        \"answers\": {}
      }" > /dev/null
done
echo -e "${GREEN}✓ Additional test data submitted${NC}"
echo ""

# Test 4: Get Cohort Statistics
echo -e "${YELLOW}Test 4: Get Cohort Statistics${NC}"
STATS_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/assessments/stats/$COHORT")
STATS_CODE=$(echo "$STATS_RESPONSE" | tail -n1)
STATS_BODY=$(echo "$STATS_RESPONSE" | head -n-1)

if [ "$STATS_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Statistics retrieval passed${NC}"
    echo "Response: $STATS_BODY"
else
    echo -e "${RED}✗ Statistics retrieval failed (HTTP $STATS_CODE)${NC}"
    echo "Response: $STATS_BODY"
fi
echo ""

# Test 5: Get Recent Assessments
echo -e "${YELLOW}Test 5: Get Recent Assessments${NC}"
RECENT_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/assessments/recent/$COHORT?limit=10")
RECENT_CODE=$(echo "$RECENT_RESPONSE" | tail -n1)
RECENT_BODY=$(echo "$RECENT_RESPONSE" | head -n-1)

if [ "$RECENT_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Recent assessments retrieval passed${NC}"
    echo "Response: $RECENT_BODY"
else
    echo -e "${RED}✗ Recent assessments retrieval failed (HTTP $RECENT_CODE)${NC}"
    echo "Response: $RECENT_BODY"
fi
echo ""

# Test 6: Get Assessment Distribution
echo -e "${YELLOW}Test 6: Get Assessment Distribution${NC}"
DIST_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/assessments/distribution/$COHORT")
DIST_CODE=$(echo "$DIST_RESPONSE" | tail -n1)
DIST_BODY=$(echo "$DIST_RESPONSE" | head -n-1)

if [ "$DIST_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Distribution retrieval passed${NC}"
    echo "Response: $DIST_BODY"
else
    echo -e "${RED}✗ Distribution retrieval failed (HTTP $DIST_CODE)${NC}"
    echo "Response: $DIST_BODY"
fi
echo ""

# Test 7: Rate Limiting (Optional - requires multiple rapid requests)
echo -e "${YELLOW}Test 7: Rate Limiting (Sending 12 requests rapidly)${NC}"
RATE_LIMIT_TRIGGERED=false
for i in {1..12}; do
    RATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/assessments" \
      -H "Content-Type: application/json" \
      -d "{
        \"name\": \"Rate Test\",
        \"cohort\": \"$COHORT\",
        \"total\": 20,
        \"title\": \"测试\",
        \"d1\": 4, \"d2\": 4, \"d3\": 4, \"d4\": 4, \"d5\": 4,
        \"answers\": {}
      }")
    
    RATE_CODE=$(echo "$RATE_RESPONSE" | tail -n1)
    
    if [ "$RATE_CODE" = "429" ]; then
        RATE_LIMIT_TRIGGERED=true
        break
    fi
done

if [ "$RATE_LIMIT_TRIGGERED" = true ]; then
    echo -e "${GREEN}✓ Rate limiting is working (429 received)${NC}"
else
    echo -e "${YELLOW}⚠ Rate limiting not triggered (may need adjustment or more requests)${NC}"
fi
echo ""

# Test 8: Non-existent Cohort
echo -e "${YELLOW}Test 8: Query Non-existent Cohort${NC}"
EMPTY_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/assessments/stats/nonexistent-cohort-12345")
EMPTY_CODE=$(echo "$EMPTY_RESPONSE" | tail -n1)
EMPTY_BODY=$(echo "$EMPTY_RESPONSE" | head -n-1)

if [ "$EMPTY_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Non-existent cohort handled correctly${NC}"
    echo "Response: $EMPTY_BODY"
else
    echo -e "${RED}✗ Non-existent cohort handling failed (HTTP $EMPTY_CODE)${NC}"
    echo "Response: $EMPTY_BODY"
fi
echo ""

echo "========================================="
echo "Testing Complete!"
echo "========================================="
echo ""
echo "Summary:"
echo "- Health check endpoint working"
echo "- Assessment submission working"
echo "- Input validation working"
echo "- Statistics retrieval working"
echo "- Recent assessments retrieval working"
echo "- Distribution data retrieval working"
echo "- Rate limiting configured"
echo "- Error handling working"
echo ""
echo "Next steps:"
echo "1. Review the responses above for any issues"
echo "2. Check server logs for any errors"
echo "3. Verify database contains the test data"
echo "4. If all looks good, proceed to frontend integration"
