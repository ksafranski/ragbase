#!/bin/bash

# Configuration
BASE_URL="${RAG_API_URL:-http://localhost:8000}"
COLLECTION="${RAG_COLLECTION:-test_collection}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper function to print colored output
print_section() {
    echo -e "\n${BLUE}==>${NC} ${1}"
}

print_success() {
    echo -e "${GREEN}✓${NC} ${1}"
}

print_error() {
    echo -e "${RED}✗${NC} ${1}"
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} ${1}"
}

# Pretty print JSON
pretty_json() {
    if command -v jq &> /dev/null; then
        echo "$1" | jq .
    else
        echo "$1" | python3 -m json.tool 2>/dev/null || echo "$1"
    fi
}

# Usage function
usage() {
    cat << EOF
Usage: $0 <command> [arguments]

Commands:
  health                          Check service health
  embed <text>                    Generate embeddings for text
  create <collection>             Create a new collection
  list                            List all collections
  upsert <collection> <text>      Add a document to collection
  search <collection> <query>     Search for similar documents
  delete <collection>             Delete a collection
  demo                            Run a complete demo workflow

Environment Variables:
  RAG_API_URL                     API base URL (default: http://localhost:8000)
  RAG_COLLECTION                  Default collection name (default: test_collection)

Examples:
  $0 embed "this is a test"
  $0 search test_collection "what is a test?"
  $0 upsert test_collection "The quick brown fox jumps over the lazy dog"
  $0 demo

EOF
    exit 1
}

# Check if service is running
check_service() {
    if ! curl -s -f "${BASE_URL}/" > /dev/null 2>&1; then
        print_error "Service not reachable at ${BASE_URL}"
        print_info "Make sure the service is running: docker-compose up"
        exit 1
    fi
}

# Command implementations
cmd_health() {
    print_section "Checking service health"
    response=$(curl -s "${BASE_URL}/health")
    pretty_json "$response"
    if echo "$response" | grep -q "healthy"; then
        print_success "Service is healthy"
    else
        print_error "Service is not healthy"
    fi
}

cmd_embed() {
    local text="$1"
    if [ -z "$text" ]; then
        print_error "Text is required"
        echo "Usage: $0 embed <text>"
        exit 1
    fi
    
    print_section "Generating embedding for: \"${text}\""
    response=$(curl -s -X POST "${BASE_URL}/embed" \
        -H "Content-Type: application/json" \
        -d "{\"text\": \"${text}\"}")
    
    # Show just metadata, not the full vector
    if command -v jq &> /dev/null; then
        echo "$response" | jq '{model: .model, dimension: .dimension, embedding_length: (.embeddings[0] | length)}'
        print_info "First 5 values: $(echo "$response" | jq -r '.embeddings[0][:5] | @json')"
    else
        pretty_json "$response"
    fi
    print_success "Embedding generated"
}

cmd_create() {
    local collection="${1:-$COLLECTION}"
    print_section "Creating collection: ${collection}"
    response=$(curl -s -X POST "${BASE_URL}/collections/${collection}")
    pretty_json "$response"
    if echo "$response" | grep -q "created"; then
        print_success "Collection created"
    else
        print_info "Collection may already exist or error occurred"
    fi
}

cmd_list() {
    print_section "Listing all collections"
    response=$(curl -s "${BASE_URL}/collections")
    pretty_json "$response"
}

cmd_upsert() {
    local collection="${1:-$COLLECTION}"
    local text="$2"
    
    if [ -z "$text" ]; then
        print_error "Text is required"
        echo "Usage: $0 upsert [collection] <text>"
        exit 1
    fi
    
    print_section "Upserting document to collection: ${collection}"
    print_info "Text: \"${text}\""
    
    response=$(curl -s -X POST "${BASE_URL}/upsert" \
        -H "Content-Type: application/json" \
        -d "{\"collection\": \"${collection}\", \"documents\": [{\"text\": \"${text}\"}]}")
    
    pretty_json "$response"
    if echo "$response" | grep -q "success"; then
        print_success "Document added"
    else
        print_error "Failed to add document"
    fi
}

cmd_search() {
    local collection="${1:-$COLLECTION}"
    local query="$2"
    
    if [ -z "$query" ]; then
        print_error "Query is required"
        echo "Usage: $0 search [collection] <query>"
        exit 1
    fi
    
    print_section "Searching in collection: ${collection}"
    print_info "Query: \"${query}\""
    
    response=$(curl -s -X POST "${BASE_URL}/search" \
        -H "Content-Type: application/json" \
        -d "{\"collection\": \"${collection}\", \"query\": \"${query}\", \"limit\": 5}")
    
    pretty_json "$response"
    
    # Show result count
    if command -v jq &> /dev/null; then
        count=$(echo "$response" | jq '.results | length')
        print_success "Found ${count} results"
    fi
}

cmd_delete() {
    local collection="${1:-$COLLECTION}"
    print_section "Deleting collection: ${collection}"
    response=$(curl -s -X DELETE "${BASE_URL}/collections/${collection}")
    pretty_json "$response"
    if echo "$response" | grep -q "deleted"; then
        print_success "Collection deleted"
    else
        print_error "Failed to delete collection"
    fi
}

cmd_demo() {
    print_section "Running complete demo workflow"
    
    echo ""
    print_info "Step 1: Check health"
    cmd_health
    
    echo ""
    print_info "Step 2: Create a demo collection"
    cmd_create "demo_collection"
    
    echo ""
    print_info "Step 3: Add some sample documents"
    cmd_upsert "demo_collection" "The quick brown fox jumps over the lazy dog"
    cmd_upsert "demo_collection" "Python is a popular programming language"
    cmd_upsert "demo_collection" "Machine learning models can process natural language"
    cmd_upsert "demo_collection" "The cat sat on the mat and fell asleep"
    
    echo ""
    print_info "Step 4: List collections"
    cmd_list
    
    echo ""
    print_info "Step 5: Search for 'animals'"
    cmd_search "demo_collection" "animals"
    
    echo ""
    print_info "Step 6: Search for 'programming'"
    cmd_search "demo_collection" "programming"
    
    echo ""
    print_info "Step 7: Generate embedding"
    cmd_embed "test embedding"
    
    echo ""
    print_success "Demo complete!"
    print_info "To clean up, run: $0 delete demo_collection"
}

# Main script
if [ $# -eq 0 ]; then
    usage
fi

# Check service availability first
check_service

command="$1"
shift

case "$command" in
    health)
        cmd_health
        ;;
    embed)
        cmd_embed "$@"
        ;;
    create)
        cmd_create "$@"
        ;;
    list)
        cmd_list
        ;;
    upsert)
        cmd_upsert "$@"
        ;;
    search)
        cmd_search "$@"
        ;;
    delete)
        cmd_delete "$@"
        ;;
    demo)
        cmd_demo
        ;;
    *)
        print_error "Unknown command: $command"
        usage
        ;;
esac

