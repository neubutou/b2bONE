#!/bin/bash

echo "🚀 B2B Portal Deployment Script"
echo "================================"
echo ""

# Parse arguments
ENVIRONMENT=${1:-production}

echo "Deploying to: $ENVIRONMENT"
echo ""

# Build check
echo "🔨 Building applications..."

# Build sync service
echo "Building salesforce-sync..."
npm run build --workspace=packages/salesforce-sync

if [ $? -ne 0 ]; then
    echo "❌ Build failed: salesforce-sync"
    exit 1
fi

# Build web app
echo "Building web app..."
npm run build --workspace=apps/web

if [ $? -ne 0 ]; then
    echo "❌ Build failed: web app"
    exit 1
fi

echo "✅ Build successful"
echo ""

# Database migrations
echo "🗄️  Running database migrations..."

if command -v supabase >/dev/null 2>&1; then
    echo "Applying Supabase migrations..."
    supabase db push

    if [ $? -ne 0 ]; then
        echo "❌ Migration failed"
        exit 1
    fi

    echo "✅ Migrations applied"
else
    echo "⚠️  Supabase CLI not found. Please apply migrations manually."
fi

echo ""

# Deploy frontend
echo "🌐 Deploying Frontend..."
echo ""
echo "If using Vercel:"
echo "  $ vercel --prod"
echo ""
echo "If using other platform, follow their deployment guide."
echo ""

# Sync Service Deployment
echo "⚙️  Sync Service Deployment"
echo "================================"
echo ""
echo "For production sync service, you can:"
echo ""
echo "1. Run as a persistent process with PM2:"
echo "   $ pm2 start packages/salesforce-sync/dist/scheduler.js --name salesforce-sync"
echo ""
echo "2. Run as a systemd service (Linux)"
echo "   See scripts/systemd/salesforce-sync.service"
echo ""
echo "3. Run as a cron job:"
echo "   $ crontab -e"
echo "   */4 * * * * cd /path/to/b2bONE && npm run sync all"
echo ""

echo "================================"
echo "✅ Deployment preparation complete!"
echo "================================"
