#!/bin/bash

# Test script for model configuration functionality
# This script tests the new model management features

echo "🧪 Testing Model Configuration Features"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_BASE="http://localhost:8000"

# Function to check if service is running
check_service() {
    echo -n "Checking if service is running... "
    if curl -s -f "$API_BASE/health" > /dev/null; then
        echo -e "${GREEN}✓ Service is healthy${NC}"
        return 0
    else
        echo -e "${RED}✗ Service is not running${NC}"
        echo "Please start the service first: docker-compose up -d"
        exit 1
    fi
}

# Function to test endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    
    echo ""
    echo -e "${YELLOW}Testing: $name${NC}"
    echo "Request: $method $endpoint"
    
    if [ -z "$data" ]; then
        response=$(curl -s -X $method "$API_BASE$endpoint")
    else
        echo "Data: $data"
        response=$(curl -s -X $method "$API_BASE$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    echo "Response:"
    echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
    echo ""
}

# Start tests
check_service

echo ""
echo "Test 1: List Available Models"
echo "------------------------------"
test_endpoint "List Models" "GET" "/models"

echo ""
echo "Test 2: Create Collection with Specific Model"
echo "----------------------------------------------"
test_endpoint "Create Collection" "POST" "/collections/test_model_collection" \
    '{"model": null, "distance": "cosine"}'

echo ""
echo "Test 3: Upsert Documents (should use collection model)"
echo "-------------------------------------------------------"
test_endpoint "Upsert Documents" "POST" "/upsert" \
    '{
        "collection": "test_model_collection",
        "documents": [
            {"text": "The quick brown fox jumps over the lazy dog"},
            {"text": "Machine learning is a subset of artificial intelligence"}
        ]
    }'

echo ""
echo "Test 4: Search Documents (should use collection model)"
echo "-------------------------------------------------------"
test_endpoint "Search Documents" "POST" "/search" \
    '{
        "collection": "test_model_collection",
        "query": "What is AI?",
        "limit": 2
    }'

echo ""
echo "Test 5: Get Collection Info (should show model)"
echo "------------------------------------------------"
test_endpoint "Collection Info" "GET" "/collections/test_model_collection/info?limit=10"

echo ""
echo "Test 6: Generate Embeddings with Default Model"
echo "-----------------------------------------------"
test_endpoint "Generate Embeddings" "POST" "/embed" \
    '{"text": "Hello, world!"}'

echo ""
echo "Test 7: Health Check (should show loaded models)"
echo "-------------------------------------------------"
test_endpoint "Health Check" "GET" "/health"

echo ""
echo "Test 8: Root Endpoint (should show model info)"
echo "-----------------------------------------------"
test_endpoint "Root Info" "GET" "/"

echo ""
echo -e "${GREEN}✓ All tests completed!${NC}"
echo ""
echo "To clean up the test collection:"
echo "  curl -X DELETE $API_BASE/collections/test_model_collection"

