#!/bin/bash

echo "🚀 B2B Portal Setup Script"
echo "================================"
echo ""

# Check for required tools
echo "📋 Checking prerequisites..."

command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed. Aborting." >&2; exit 1; }
command -v sf >/dev/null 2>&1 || { echo "⚠️  Salesforce CLI (sf) not found. Please install: npm install -g @salesforce/cli" >&2; }

echo "✅ Prerequisites OK"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo ""
echo "✅ Dependencies installed"
echo ""

# Setup Supabase
echo "🗄️  Supabase Setup"
echo "================================"

# Check if Supabase CLI is installed
if ! command -v supabase >/dev/null 2>&1; then
    echo "⚠️  Supabase CLI not found."
    echo "   Install it globally with: npm install -g supabase"
    echo "   Or continue with manual setup"
else
    echo "✅ Supabase CLI found"

    # Ask to start local Supabase
    read -p "Start local Supabase instance? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        supabase start
        echo ""
        echo "✅ Supabase local instance started"
        echo "   Studio URL: http://localhost:54323"
        echo ""
    fi
fi

# Environment setup
echo "⚙️  Environment Configuration"
echo "================================"

# Sync service .env
if [ ! -f "packages/salesforce-sync/.env" ]; then
    echo "Creating .env for salesforce-sync..."
    cp packages/salesforce-sync/.env.example packages/salesforce-sync/.env
    echo "⚠️  Please edit packages/salesforce-sync/.env with your credentials"
else
    echo "✅ salesforce-sync/.env already exists"
fi

# Web app .env
if [ ! -f "apps/web/.env.local" ]; then
    echo "Creating .env.local for web app..."
    cp apps/web/.env.example apps/web/.env.local
    echo "⚠️  Please edit apps/web/.env.local with your Supabase credentials"
else
    echo "✅ apps/web/.env.local already exists"
fi

echo ""
echo "================================"
echo "✅ Setup Complete!"
echo "================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Configure environment variables:"
echo "   - packages/salesforce-sync/.env"
echo "   - apps/web/.env.local"
echo ""
echo "2. Login to Salesforce CLI:"
echo "   $ sf org login web --alias production"
echo ""
echo "3. Run database migrations (if using Supabase CLI):"
echo "   $ supabase db push"
echo ""
echo "4. Start development:"
echo "   $ npm run dev"
echo ""
echo "5. Run sync service:"
echo "   $ npm run sync all"
echo ""
echo "6. Start scheduler (production):"
echo "   $ npm run scheduler --workspace=packages/salesforce-sync"
echo ""
