#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║      B2B Portal - Quickstart Setup                        ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

echo "📋 Schritt 1: Supabase Cloud Projekt erstellen"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Öffnen Sie: https://supabase.com"
echo "2. Klicken Sie auf 'Start your project'"
echo "3. Erstellen Sie ein kostenloses Konto (GitHub/Google/Email)"
echo "4. Erstellen Sie ein neues Projekt:"
echo "   - Name: b2bone-portal"
echo "   - Database Password: [Wählen Sie ein sicheres Passwort]"
echo "   - Region: Europe (Frankfurt oder Nähe)"
echo ""
read -p "Drücken Sie Enter, wenn Sie das Projekt erstellt haben..."
echo ""

echo "📋 Schritt 2: Supabase Credentials kopieren"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Im Supabase Dashboard:"
echo "1. Gehen Sie zu: Settings → API"
echo "2. Kopieren Sie:"
echo "   - Project URL"
echo "   - anon public key"
echo "   - service_role key (⚠️ geheim halten!)"
echo ""

read -p "Project URL eingeben: " SUPABASE_URL
read -p "Anon Key eingeben: " SUPABASE_ANON_KEY
read -sp "Service Role Key eingeben: " SUPABASE_SERVICE_KEY
echo ""
echo ""

# Validate inputs
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo "❌ Fehler: Alle Felder müssen ausgefüllt werden!"
    exit 1
fi

echo "✅ Credentials erfasst"
echo ""

echo "📋 Schritt 3: Environment-Dateien erstellen"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Create sync service .env
cat > packages/salesforce-sync/.env <<EOF
# Supabase Configuration
SUPABASE_URL=$SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_KEY

# Salesforce Configuration
SALESFORCE_ORG_ALIAS=production
SALESFORCE_API_VERSION=59.0

# Custom Object API Names (anpassen!)
SALESFORCE_PROJECT_OBJECT=Project__c
SALESFORCE_LEISTUNGSNACHWEIS_OBJECT=ServiceRecord__c

# Sync Configuration
SYNC_INTERVAL_HOURS=4
LOG_LEVEL=info
EOF

echo "✅ packages/salesforce-sync/.env erstellt"

# Create web .env.local
cat > apps/web/.env.local <<EOF
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF

echo "✅ apps/web/.env.local erstellt"
echo ""

echo "📋 Schritt 4: Datenbank-Schema erstellen"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Öffnen Sie Ihr Supabase Dashboard:"
echo "1. Gehen Sie zu: SQL Editor"
echo "2. Klicken Sie auf '+ New Query'"
echo "3. Kopieren Sie den Inhalt der Datei:"
echo "   supabase/migrations/20250101000000_initial_schema.sql"
echo "4. Fügen Sie ihn in den SQL Editor ein"
echo "5. Klicken Sie auf 'Run'"
echo ""
echo "Die SQL-Datei befindet sich hier:"
echo "   $(pwd)/supabase/migrations/20250101000000_initial_schema.sql"
echo ""

read -p "Drücken Sie Enter, wenn Sie die Migration ausgeführt haben..."
echo ""

echo "📋 Schritt 5: Storage Bucket erstellen"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Im Supabase Dashboard:"
echo "1. Gehen Sie zu: Storage"
echo "2. Klicken Sie auf 'Create bucket'"
echo "3. Name: project-assets"
echo "4. Public: ❌ Nein (private bucket)"
echo "5. Klicken Sie auf 'Create bucket'"
echo ""

read -p "Drücken Sie Enter, wenn Sie den Bucket erstellt haben..."
echo ""

echo "📋 Schritt 6: Test-User erstellen"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
read -p "Test-User Email eingeben: " TEST_EMAIL
read -sp "Test-User Passwort eingeben: " TEST_PASSWORD
echo ""
echo ""

echo "Im Supabase Dashboard:"
echo "1. Gehen Sie zu: Authentication → Users"
echo "2. Klicken Sie auf 'Add user' → 'Create new user'"
echo "3. Email: $TEST_EMAIL"
echo "4. Password: [Ihr gewähltes Passwort]"
echo "5. Auto Confirm User: ✅ Ja"
echo "6. Klicken Sie auf 'Create user'"
echo "7. ⚠️ WICHTIG: Kopieren Sie die User UUID (z.B. 550e8400-e29b-41d4-a716-446655440000)"
echo ""

read -p "User UUID eingeben: " USER_UUID
echo ""

if [ -z "$USER_UUID" ]; then
    echo "⚠️  Warnung: Keine User UUID eingegeben. Sie müssen später einen Customer-Record manuell erstellen."
else
    echo "📋 Schritt 7: Customer-Record erstellen"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Im Supabase Dashboard:"
    echo "1. Gehen Sie zu: Table Editor → customers"
    echo "2. Klicken Sie auf 'Insert' → 'Insert row'"
    echo "3. Füllen Sie aus:"
    echo "   - id: $USER_UUID"
    echo "   - salesforce_account_id: 0011234567890ABC (Beispiel)"
    echo "   - email: $TEST_EMAIL"
    echo "   - company_name: Test Firma GmbH"
    echo "   - contact_name: Max Mustermann"
    echo "   - is_active: true"
    echo "4. Klicken Sie auf 'Save'"
    echo ""

    read -p "Drücken Sie Enter, wenn Sie den Customer erstellt haben..."
    echo ""
fi

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║      ✅ Setup Abgeschlossen!                               ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "🚀 Frontend starten:"
echo "   cd $(pwd)"
echo "   npm run dev"
echo ""
echo "Dann öffnen Sie: http://localhost:3000"
echo ""
echo "Login-Daten:"
echo "   Email: $TEST_EMAIL"
echo "   Passwort: [Ihr gewähltes Passwort]"
echo ""
echo "📚 Weitere Informationen:"
echo "   - README.md - Projekt-Übersicht"
echo "   - SETUP.md - Detaillierte Setup-Anleitung"
echo ""
echo "⚠️  Nächste Schritte:"
echo "   - Salesforce CLI konfigurieren: sf org login web --alias production"
echo "   - Feldnamen in packages/salesforce-sync/src/lib/salesforce-client.ts anpassen"
echo "   - Ersten Sync durchführen: npm run sync all"
echo ""
