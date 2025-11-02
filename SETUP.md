# B2B Portal - Setup Anleitung

Komplette Anleitung für die Einrichtung des Salesforce-Supabase-Sync-Portals.

## Voraussetzungen

### Software installieren

1. **Node.js** (>= 18)
   ```bash
   # Prüfen
   node --version
   ```

2. **Salesforce CLI**
   ```bash
   npm install -g @salesforce/cli

   # Prüfen
   sf --version
   ```

3. **Supabase CLI** (optional, aber empfohlen)
   ```bash
   npm install -g supabase

   # Prüfen
   supabase --version
   ```

## 1. Projekt Setup

```bash
# Repository klonen (falls noch nicht geschehen)
cd b2bONE

# Automatisches Setup
./scripts/setup.sh

# ODER manuell:
npm install
```

## 2. Supabase Einrichtung

### Option A: Supabase CLI (Empfohlen)

```bash
# Lokales Projekt initialisieren (bereits erledigt)
# supabase init

# Lokale Supabase-Instanz starten
supabase start

# Migrations anwenden
supabase db push
```

Nach `supabase start` erhalten Sie:
- Studio URL: http://localhost:54323
- API URL: http://localhost:54321
- DB URL: postgresql://postgres:postgres@localhost:54322/postgres

### Option B: Supabase Cloud

1. Gehen Sie zu https://supabase.com
2. Erstellen Sie ein neues Projekt
3. Kopieren Sie die Credentials:
   - Project URL
   - Anon (public) Key
   - Service Role Key

4. Migrations manuell ausführen:
   - Öffnen Sie Supabase Studio → SQL Editor
   - Kopieren Sie den Inhalt von `supabase/migrations/20250101000000_initial_schema.sql`
   - Führen Sie das SQL aus

5. Storage Bucket erstellen:
   - Gehen Sie zu Storage
   - Erstellen Sie einen Bucket: `project-assets`
   - Setzen Sie Privacy auf "Private"

## 3. Salesforce CLI Setup

```bash
# Login zu Salesforce
sf org login web --alias production

# Verbindung testen
sf org display --target-org production

# Custom Objects abfragen (Beispiel)
sf data query --query "SELECT Id, Name FROM Account LIMIT 5" --target-org production
```

### Custom Objects konfigurieren

Bearbeiten Sie `packages/salesforce-sync/.env`:

```env
# Ihre Custom Object API Namen
SALESFORCE_PROJECT_OBJECT=Project__c
SALESFORCE_LEISTUNGSNACHWEIS_OBJECT=ServiceRecord__c
```

**WICHTIG**: Passen Sie die SOQL-Queries in folgenden Dateien an Ihre Salesforce-Custom-Objects an:

- `packages/salesforce-sync/src/lib/salesforce-client.ts`
  - Methode `getProjects()` - Zeile ~70
  - Methode `getLeistungsnachweise()` - Zeile ~95

Ersetzen Sie die Feldnamen wie `Account__c`, `ProjectNumber__c`, etc. mit Ihren echten Custom Field API-Namen.

## 4. Environment-Konfiguration

### Sync Service: `packages/salesforce-sync/.env`

```env
# Supabase
SUPABASE_URL=http://localhost:54321  # oder Ihre Cloud-URL
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Salesforce
SALESFORCE_ORG_ALIAS=production
SALESFORCE_API_VERSION=59.0

# Custom Objects
SALESFORCE_PROJECT_OBJECT=Project__c
SALESFORCE_LEISTUNGSNACHWEIS_OBJECT=ServiceRecord__c

# Sync Interval
SYNC_INTERVAL_HOURS=4
```

### Web App: `apps/web/.env.local`

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321  # oder Ihre Cloud-URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 5. Kunden-Accounts erstellen

Bevor Kunden sich einloggen können, müssen Sie:

1. **Supabase Auth User erstellen**
   ```sql
   -- In Supabase Studio → SQL Editor
   -- Dies wird normalerweise via Supabase Auth gemacht, aber für Test:
   ```

2. **Customer-Record erstellen**
   ```sql
   INSERT INTO customers (id, salesforce_account_id, email, company_name, contact_name)
   VALUES (
     'auth-user-uuid-here',  -- Die UUID vom Supabase Auth User
     '0011234567890ABC',     -- Salesforce Account ID
     'kunde@firma.de',
     'Firma GmbH',
     'Max Mustermann'
   );
   ```

3. **Oder via Supabase Dashboard**:
   - Authentication → Users → Add User
   - Kopieren Sie die User UUID
   - Database → customers → Insert row

## 6. Entwicklung starten

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Einmaliger Sync-Test
npm run sync all

# Terminal 3 (Optional): Scheduler für automatischen Sync
npm run scheduler --workspace=packages/salesforce-sync
```

Öffnen Sie http://localhost:3000

## 7. Sync-Service testen

```bash
# Einzelne Sync-Jobs testen
npm run sync opportunities
npm run sync projects
npm run sync leistungsnachweise
npm run sync assets

# Alles synchronisieren
npm run sync all
```

## 8. Production Deployment

### Frontend (Vercel)

```bash
# Vercel CLI installieren
npm install -g vercel

# Deployen
cd apps/web
vercel --prod
```

Umgebungsvariablen in Vercel setzen:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Supabase Production

```bash
# Mit Supabase Cloud-Projekt verbinden
supabase link --project-ref your-project-ref

# Migrations anwenden
supabase db push
```

### Sync-Service (Server)

**Option 1: PM2 (Empfohlen)**

```bash
# PM2 installieren
npm install -g pm2

# Build
npm run build --workspace=packages/salesforce-sync

# Service starten
pm2 start packages/salesforce-sync/dist/scheduler.js --name salesforce-sync

# Auto-Start bei Server-Neustart
pm2 save
pm2 startup
```

**Option 2: Systemd Service (Linux)**

```bash
# Service-Datei kopieren
sudo cp scripts/systemd/salesforce-sync.service /etc/systemd/system/

# Service aktivieren
sudo systemctl enable salesforce-sync
sudo systemctl start salesforce-sync

# Status prüfen
sudo systemctl status salesforce-sync

# Logs ansehen
sudo journalctl -u salesforce-sync -f
```

**Option 3: Cron Job**

```bash
crontab -e

# Alle 4 Stunden synchronisieren
0 */4 * * * cd /pfad/zu/b2bONE && npm run sync all >> /var/log/salesforce-sync.log 2>&1
```

## 9. Troubleshooting

### Salesforce CLI Fehler

```bash
# Neu einloggen
sf org logout --target-org production
sf org login web --alias production

# Verbindung testen
sf org display --target-org production
```

### Supabase Verbindungsfehler

```bash
# Lokale Instanz neu starten
supabase stop
supabase start

# Status prüfen
supabase status
```

### Migration-Fehler

```bash
# Lokale DB zurücksetzen
supabase db reset

# Migrations neu anwenden
supabase db push
```

### Sync-Service Fehler

```bash
# Logs prüfen
tail -f packages/salesforce-sync/logs/*.log

# Mit Debug-Modus starten
LOG_LEVEL=debug npm run sync all
```

## 10. Custom Field Mapping

**WICHTIG**: Passen Sie die Salesforce-Feldnamen an!

Bearbeiten Sie `packages/salesforce-sync/src/lib/salesforce-client.ts`:

```typescript
// Beispiel: Projects Custom Object
const soql = `
  SELECT
    Id,
    Name,
    IhrAccount__c,           // ← Ihr Feld für Account
    IhreOpportunity__c,      // ← Ihr Feld für Opportunity
    IhrProjektNummer__c,     // ← Ihr Feld für Projekt-Nummer
    IhrStatus__c,            // ← Ihr Feld für Status
    // ... weitere Felder
  FROM ${objectApiName}
`;
```

## Support

Bei Problemen:

1. Logs prüfen
2. Environment-Variablen kontrollieren
3. Salesforce-Verbindung testen
4. Supabase-Verbindung testen

## Nächste Schritte

- [ ] Salesforce Custom Objects konfigurieren
- [ ] Feldnamen in Sync-Scripts anpassen
- [ ] Test-Kunden anlegen
- [ ] Ersten Sync durchführen
- [ ] Frontend testen
- [ ] Production-Deployment
