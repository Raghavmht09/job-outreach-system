#!/bin/bash
# Sprint 1 - API Smoke Tests
# Quick automated tests for critical endpoints
# Run this after starting dev server: npm run dev

set -e  # Exit on error

echo "🧪 Starting API Smoke Tests..."
echo "================================"
echo ""

# Configuration
BASE_URL="http://localhost:3000"
STUB_USER_ID="${NEXT_PUBLIC_STUB_USER_ID:-5544832A-6F3B-407D-8821-45054DC28761}"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

# Helper function to test API endpoint
test_endpoint() {
    local test_name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_status="$5"
    
    echo "Testing: $test_name"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    fi
    
    # Extract status code (last line)
    status_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$status_code" = "$expected_status" ] || ([ "$test_name" = "Server is running" ] && [ "$status_code" = "307" ]); then
        echo -e "${GREEN}✓ PASS${NC} - Status: $status_code"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} - Expected: $expected_status, Got: $status_code"
        echo "Response: $body"
        ((FAILED++))
    fi
    echo ""
}

# Test 1: Health Check (Server Running)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST SUITE 1: Server Health"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "Server is running" "GET" "/" "200"

# Test 2: Resume Upload (File validation)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST SUITE 2: Resume Upload"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚠️  Skipping file upload test (requires multipart/form-data)"
echo "   Manual test required: Upload a PDF/DOCX resume via UI"
echo ""

# Test 3: Message Generation (Mock data)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST SUITE 3: Message Generation API"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test 3.1: Valid message generation request
test_endpoint "Generate message - Valid input" "POST" "/api/message/generate" \
'{
  "contact_name": "John Smith",
  "contact_title": "Senior Recruiter",
  "company_name": "Google",
  "job_title": "Software Engineer",
  "tone": "professional",
  "job_description": "We are looking for a talented software engineer..."
}' "200"

# Test 3.2: Invalid input (missing required fields)
test_endpoint "Generate message - Missing contact_name" "POST" "/api/message/generate" \
'{
  "company_name": "Google",
  "job_title": "Software Engineer",
  "tone": "professional"
}' "400"

# Test 3.3: Invalid tone
test_endpoint "Generate message - Invalid tone" "POST" "/api/message/generate" \
'{
  "contact_name": "John Smith",
  "company_name": "Google",
  "job_title": "Software Engineer",
  "tone": "invalid_tone"
}' "400"

# Test 4: Contact Search (Mock data)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST SUITE 4: Contact Search API"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test 4.1: Valid search
test_endpoint "Search contacts - Valid company" "POST" "/api/contacts/search" \
'{
  "company_name": "Google"
}' "200"

# Test 4.2: Missing company name
test_endpoint "Search contacts - Missing company_name" "POST" "/api/contacts/search" \
'{}' "400"

# Test 5: Resume Current (Get user's resume)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST SUITE 5: Resume Retrieval"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_endpoint "Get current resume" "GET" "/api/resume/current" "" "404"
echo "ℹ️  404 is expected if no resume uploaded yet"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST SUITE 6: Job Extraction APIs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_endpoint "Extract job from URL - missing url" "POST" "/api/job/extract-url" \
'{}' "400"

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All API smoke tests passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run manual QA checklist (see sprint-1-qa-checklist.md)"
    echo "2. Test with real Claude API key"
    echo "3. Verify database persistence in Supabase"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Review errors above.${NC}"
    echo ""
    echo "Common issues:"
    echo "- Dev server not running (npm run dev)"
    echo "- Environment variables not configured"
    echo "- Database connection issues"
    exit 1
fi

