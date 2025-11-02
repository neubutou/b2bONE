# B2B Portal - Salesforce Supabase Sync

B2B-Kundenportal mit bidirektionaler Salesforce-Synchronisation über Supabase.

## Features

- 🔄 Automatische Salesforce-Synchronisation (Custom Objects + Opportunities)
- 📊 Kunden-Portal für Projekteinsicht
- 📤 Asset-Upload mit Salesforce-Integration
- 📋 Leistungsnachweise für Kunden
- 🔐 Supabase Authentication

## Projekt-Struktur

```
b2bONE/
├── apps/
│   └── web/              # Next.js Frontend (B2B Portal)
├── packages/
│   └── salesforce-sync/  # Salesforce CLI Integration & Sync Service
├── supabase/             # Supabase Migrations & Config
└── scripts/              # Deployment & Setup Scripts
```

## Voraussetzungen

- Node.js >= 18
- Salesforce CLI (`sf` CLI)
- Supabase CLI (`supabase` CLI)

## Installation

```bash
# Dependencies installieren
npm install

# Supabase lokal starten
npm run db:setup

# Migrations ausführen
npm run db:migrate
```

## Entwicklung

```bash
# Frontend starten
npm run dev

# Sync-Service (einmalig)
npm run sync
```

## Salesforce CLI Setup

```bash
# Salesforce Login
sf org login web --alias production

# Custom Objects abfragen
sf data query --query "SELECT Id, Name FROM CustomObject__c" --target-org production
```

## Supabase CLI Setup

```bash
# Lokales Projekt initialisieren
supabase init

# Lokale Datenbank starten
supabase start

# Migration erstellen
supabase migration new initial_schema

# Migration anwenden
supabase db push
```

## Deployment

```bash
# Supabase Deployment
supabase link --project-ref <project-id>
supabase db push

# Frontend Deployment (Vercel)
vercel --prod
```
