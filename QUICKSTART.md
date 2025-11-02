# 🚀 Quickstart - In 10 Minuten einsatzbereit!

Folgen Sie diesen Schritten, um das Portal schnell zum Laufen zu bringen.

## ✅ Schritt 1: Supabase Cloud Projekt erstellen (2 Min)

1. **Öffnen Sie:** https://supabase.com
2. **Klicken Sie:** "Start your project"
3. **Registrieren Sie sich** (kostenlos mit GitHub/Google/Email)
4. **Neues Projekt erstellen:**
   - **Name:** `b2bone-portal`
   - **Database Password:** [Wählen Sie ein sicheres Passwort]
   - **Region:** Europe (Frankfurt)
   - Klicken Sie "Create new project"
   - ⏱️ Warten Sie ~2 Minuten (Projekt wird erstellt)

## ✅ Schritt 2: Credentials kopieren (1 Min)

Im Supabase Dashboard:

1. **Gehen Sie zu:** Settings → API
2. **Kopieren Sie diese 3 Werte:**

   ```
   📋 Project URL:  https://xxxxxxxx.supabase.co
   📋 anon public:  eyJhbGc...
   📋 service_role: eyJhbGc... (⚠️ geheim!)
   ```

## ✅ Schritt 3: Environment-Dateien erstellen (1 Min)

### Datei 1: `packages/salesforce-sync/.env`

Erstellen Sie die Datei mit diesem Inhalt (ersetzen Sie die Werte):

```env
SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

SALESFORCE_ORG_ALIAS=production
SALESFORCE_API_VERSION=59.0
SALESFORCE_PROJECT_OBJECT=Project__c
SALESFORCE_LEISTUNGSNACHWEIS_OBJECT=ServiceRecord__c
SYNC_INTERVAL_HOURS=4
LOG_LEVEL=info
```

### Datei 2: `apps/web/.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## ✅ Schritt 4: Datenbank-Schema erstellen (2 Min)

1. **Im Supabase Dashboard:** SQL Editor
2. **Klicken Sie:** "+ New Query"
3. **Kopieren Sie:** Den kompletten Inhalt von `supabase/migrations/20250101000000_initial_schema.sql`
4. **Fügen Sie ihn ein** in den SQL Editor
5. **Klicken Sie:** "Run" (▶️)
6. ✅ Sie sollten "Success" sehen

## ✅ Schritt 5: Storage Bucket erstellen (30 Sek)

1. **Im Supabase Dashboard:** Storage
2. **Klicken Sie:** "Create bucket"
3. **Name:** `project-assets`
4. **Public:** ❌ **Nein** (private lassen)
5. **Klicken Sie:** "Create bucket"

## ✅ Schritt 6: Test-User erstellen (2 Min)

### 6.1 User anlegen

1. **Im Supabase Dashboard:** Authentication → Users
2. **Klicken Sie:** "Add user" → "Create new user"
3. **Füllen Sie aus:**
   - Email: `test@firma.de`
   - Password: `Test1234!`
   - Auto Confirm User: ✅ **Ja**
4. **Klicken Sie:** "Create user"
5. **⚠️ WICHTIG:** Kopieren Sie die **User UUID** (z.B. `550e8400-e29b-41d4-a716-446655440000`)

### 6.2 Customer-Record erstellen

1. **Im Supabase Dashboard:** Table Editor → `customers` Tabelle
2. **Klicken Sie:** "Insert" → "Insert row"
3. **Füllen Sie aus:**
   - `id`: [Die kopierte User UUID]
   - `salesforce_account_id`: `0011234567890TEST`
   - `email`: `test@firma.de`
   - `company_name`: `Test Firma GmbH`
   - `contact_name`: `Max Mustermann`
   - `is_active`: `true` ✅
4. **Klicken Sie:** "Save"

## ✅ Schritt 7: Frontend starten (1 Min)

```bash
cd /home/user/b2bONE
npm run dev
```

**Öffnen Sie:** http://localhost:3000

**Login-Daten:**
- Email: `test@firma.de`
- Passwort: `Test1234!`

---

## 🎉 Fertig!

Sie sollten jetzt:
- ✅ Die Login-Seite sehen
- ✅ Sich einloggen können
- ✅ Das Dashboard sehen

---

## 🔧 Nächste Schritte

### Optional: Test-Projekt erstellen

Um ein Projekt im Dashboard zu sehen:

1. **Im Supabase Dashboard:** Table Editor → `projects`
2. **Insert row:**
   - `salesforce_id`: `a001234567890TEST`
   - `customer_id`: [Ihre Customer UUID]
   - `name`: `Testprojekt Website Relaunch`
   - `status`: `Aktiv`
   - `start_date`: `2024-01-01`
   - `budget`: `50000`
   - `description`: `Dies ist ein Testprojekt`

### Salesforce-Sync einrichten

Siehe `SETUP.md` für:
- Salesforce CLI Login
- Custom Object Feldnamen anpassen
- Ersten Sync durchführen

---

## ❓ Probleme?

### "Invalid login credentials"
- Prüfen Sie Email/Passwort
- Stellen Sie sicher, dass "Auto Confirm User" aktiviert war
- Prüfen Sie, ob der Customer-Record existiert

### "Connection failed"
- Prüfen Sie die URLs in `.env.local`
- Stellen Sie sicher, dass keine Leerzeichen in den Keys sind

### Dashboard leer
- Erstellen Sie ein Test-Projekt (siehe oben)
- Prüfen Sie, ob `customer_id` korrekt ist

---

## 📞 Support

Weitere Infos:
- `README.md` - Projekt-Übersicht
- `SETUP.md` - Detaillierte Anleitung
- `scripts/quickstart.sh` - Interaktiver Setup-Wizard
