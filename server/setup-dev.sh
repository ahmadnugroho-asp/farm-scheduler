#!/bin/bash

# Farm Scheduler - Development Setup Script
# This script helps set up the development environment

set -e

echo "🚀 Farm Scheduler - Development Setup"
echo "====================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18.x or higher."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "⚠️  Node.js version is too old. Please upgrade to Node.js 18.x or higher."
    echo "   Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Check if we're in the server directory
if [ ! -f "package.json" ]; then
    echo "❌ This script must be run from the server directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cat > .env << 'EOF'
# Google Sheets Configuration
SHEET_ID="PASTE_YOUR_GOOGLE_SHEET_ID_HERE"

# Server Configuration
PORT=3001
EOF
    echo "✅ .env file created"
    echo "   ⚠️  Please edit .env and add your Google Sheet ID"
else
    echo "ℹ️  .env file already exists, skipping..."
fi
echo ""

# Check for service-account.json
if [ ! -f "service-account.json" ]; then
    echo "📝 Service account file not found"
    echo ""
    echo "   You have two options:"
    echo ""
    echo "   Option 1: Use real Google Service Account (Production)"
    echo "   ---------------------------------------------------------"
    echo "   1. Go to https://console.cloud.google.com/"
    echo "   2. Create a new project or select existing one"
    echo "   3. Enable Google Sheets API"
    echo "   4. Create a Service Account:"
    echo "      - Go to 'IAM & Admin' > 'Service Accounts'"
    echo "      - Click 'Create Service Account'"
    echo "      - Download the JSON key file"
    echo "   5. Save the JSON file as 'service-account.json' in this directory"
    echo "   6. Share your Google Sheet with the service account email"
    echo ""
    echo "   Option 2: Use mock for development/testing (Development)"
    echo "   ---------------------------------------------------------"
    echo "   Copy the example file:"
    echo "   $ cp service-account.json.example service-account.json"
    echo ""

    read -p "   Do you want to use the mock service account for testing? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cp service-account.json.example service-account.json
        echo "   ✅ Mock service account created"
        echo "   ⚠️  Note: API calls will fail, but the app structure will work"
    else
        echo "   ℹ️  Please manually create service-account.json with your credentials"
    fi
else
    echo "✅ service-account.json found"
fi
echo ""

# Run tests to verify setup
echo "🧪 Running tests to verify setup..."
npm test -- --passWithNoTests
echo ""

echo "✅ Setup complete!"
echo ""
echo "📚 Next steps:"
echo "   1. Edit .env file and add your Google Sheet ID"
echo "   2. If using real Google Sheets:"
echo "      - Ensure service-account.json has valid credentials"
echo "      - Share your Google Sheet with the service account email"
echo "   3. Start the server:"
echo "      $ npm start"
echo ""
echo "📖 For more information, see README.md"
