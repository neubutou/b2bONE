-- B2B Portal - Initial Schema
-- Salesforce Sync Tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CUSTOMERS TABLE
-- Kundenaccounts für Portal-Login
-- ============================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salesforce_account_id VARCHAR(18) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_sf_id ON customers(salesforce_account_id);
CREATE INDEX idx_customers_email ON customers(email);

-- ============================================
-- OPPORTUNITIES TABLE
-- Salesforce Opportunities
-- ============================================
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salesforce_id VARCHAR(18) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  stage VARCHAR(100),
  amount DECIMAL(15,2),
  close_date DATE,
  probability INTEGER,
  description TEXT,
  owner_name VARCHAR(255),
  salesforce_data JSONB, -- Für zusätzliche Custom Fields
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_opportunities_sf_id ON opportunities(salesforce_id);
CREATE INDEX idx_opportunities_customer ON opportunities(customer_id);
CREATE INDEX idx_opportunities_stage ON opportunities(stage);

-- ============================================
-- PROJECTS TABLE
-- Custom Object für Projekte aus Salesforce
-- ============================================
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salesforce_id VARCHAR(18) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  project_number VARCHAR(50),
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50),
  start_date DATE,
  end_date DATE,
  budget DECIMAL(15,2),
  description TEXT,
  salesforce_data JSONB, -- Für Custom Fields
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_sf_id ON projects(salesforce_id);
CREATE INDEX idx_projects_customer ON projects(customer_id);
CREATE INDEX idx_projects_opportunity ON projects(opportunity_id);
CREATE INDEX idx_projects_status ON projects(status);

-- ============================================
-- ASSETS TABLE
-- Hochgeladene Dateien (bidirektional mit Salesforce)
-- ============================================
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salesforce_id VARCHAR(18) UNIQUE, -- Null wenn noch nicht zu SF gesynct
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  uploaded_by_customer_id UUID REFERENCES customers(id),
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100),
  file_size BIGINT,
  storage_path VARCHAR(500) NOT NULL, -- Supabase Storage Path
  salesforce_content_document_id VARCHAR(18), -- Salesforce ContentDocument ID
  description TEXT,
  sync_status VARCHAR(50) DEFAULT 'pending', -- pending, synced, failed
  sync_error TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  synced_to_salesforce_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_assets_project ON assets(project_id);
CREATE INDEX idx_assets_customer ON assets(uploaded_by_customer_id);
CREATE INDEX idx_assets_sync_status ON assets(sync_status);
CREATE INDEX idx_assets_sf_id ON assets(salesforce_id);

-- ============================================
-- LEISTUNGSNACHWEISE (SERVICE RECORDS) TABLE
-- Leistungsnachweise für Kunden
-- ============================================
CREATE TABLE leistungsnachweise (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salesforce_id VARCHAR(18) UNIQUE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  record_number VARCHAR(50),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  service_date DATE,
  hours DECIMAL(10,2),
  amount DECIMAL(15,2),
  status VARCHAR(50),
  performed_by VARCHAR(255),
  approved BOOLEAN DEFAULT false,
  approved_by VARCHAR(255),
  approved_at TIMESTAMPTZ,
  attachment_url TEXT, -- Link zum PDF/Dokument
  salesforce_data JSONB,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leistungsnachweise_sf_id ON leistungsnachweise(salesforce_id);
CREATE INDEX idx_leistungsnachweise_project ON leistungsnachweise(project_id);
CREATE INDEX idx_leistungsnachweise_status ON leistungsnachweise(status);
CREATE INDEX idx_leistungsnachweise_date ON leistungsnachweise(service_date);

-- ============================================
-- SYNC_LOGS TABLE
-- Tracking für Salesforce-Synchronisation
-- ============================================
CREATE TABLE sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sync_type VARCHAR(50) NOT NULL, -- 'opportunities', 'projects', 'leistungsnachweise', 'assets'
  status VARCHAR(50) NOT NULL, -- 'success', 'failed', 'partial'
  records_processed INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_message TEXT,
  sync_duration_ms INTEGER,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sync_logs_type ON sync_logs(sync_type);
CREATE INDEX idx_sync_logs_status ON sync_logs(status);
CREATE INDEX idx_sync_logs_started ON sync_logs(started_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Kunden sehen nur ihre eigenen Daten
-- ============================================

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE leistungsnachweise ENABLE ROW LEVEL SECURITY;

-- Customers Policy: Nur eigene Daten sehen
CREATE POLICY "Customers can view own data"
  ON customers FOR SELECT
  USING (auth.uid()::text = id::text);

-- Opportunities Policy: Nur eigene Opportunities
CREATE POLICY "Customers can view own opportunities"
  ON opportunities FOR SELECT
  USING (customer_id IN (
    SELECT id FROM customers WHERE auth.uid()::text = id::text
  ));

-- Projects Policy: Nur eigene Projekte
CREATE POLICY "Customers can view own projects"
  ON projects FOR SELECT
  USING (customer_id IN (
    SELECT id FROM customers WHERE auth.uid()::text = id::text
  ));

-- Assets Policy: Nur eigene Assets sehen und hochladen
CREATE POLICY "Customers can view own assets"
  ON assets FOR SELECT
  USING (uploaded_by_customer_id IN (
    SELECT id FROM customers WHERE auth.uid()::text = id::text
  ));

CREATE POLICY "Customers can upload assets"
  ON assets FOR INSERT
  WITH CHECK (uploaded_by_customer_id IN (
    SELECT id FROM customers WHERE auth.uid()::text = id::text
  ));

-- Leistungsnachweise Policy: Nur eigene Leistungsnachweise
CREATE POLICY "Customers can view own leistungsnachweise"
  ON leistungsnachweise FOR SELECT
  USING (project_id IN (
    SELECT id FROM projects WHERE customer_id IN (
      SELECT id FROM customers WHERE auth.uid()::text = id::text
    )
  ));

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Updated_at Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leistungsnachweise_updated_at BEFORE UPDATE ON leistungsnachweise
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STORAGE BUCKETS
-- Für Asset-Uploads
-- ============================================

-- Storage Bucket für Assets (wird via Supabase Storage API erstellt)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('project-assets', 'project-assets', false);

COMMENT ON TABLE customers IS 'Kundenaccounts für Portal-Zugang';
COMMENT ON TABLE opportunities IS 'Salesforce Opportunities synchronisiert';
COMMENT ON TABLE projects IS 'Salesforce Custom Object: Projekte';
COMMENT ON TABLE assets IS 'Von Kunden hochgeladene Assets (bidirektional sync)';
COMMENT ON TABLE leistungsnachweise IS 'Leistungsnachweise/Service Records für Projekte';
COMMENT ON TABLE sync_logs IS 'Salesforce Synchronisations-Logs';
