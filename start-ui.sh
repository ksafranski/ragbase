#!/bin/bash

echo "🚀 Starting RAGBase UI..."
echo ""

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Navigate to UI directory
cd ui

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check if backend is running
echo "🔍 Checking if backend is running on http://localhost:8000..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Backend is running!"
else
    echo "⚠️  Warning: Backend doesn't seem to be running on http://localhost:8000"
    echo "   Please start the backend service first with:"
    echo "   docker-compose up"
    echo ""
fi

# Start the development server
echo "🎨 Starting Next.js development server..."
echo "   Open http://localhost:3000 in your browser"
echo ""
npm run dev

