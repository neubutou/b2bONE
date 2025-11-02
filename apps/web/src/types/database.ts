export interface Customer {
  id: string;
  salesforce_account_id: string;
  email: string;
  company_name: string;
  contact_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Opportunity {
  id: string;
  salesforce_id: string;
  customer_id: string;
  name: string;
  stage?: string;
  amount?: number;
  close_date?: string;
  probability?: number;
  description?: string;
  owner_name?: string;
  salesforce_data?: Record<string, any>;
  synced_at: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  salesforce_id: string;
  customer_id: string;
  opportunity_id?: string;
  project_number?: string;
  name: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  description?: string;
  salesforce_data?: Record<string, any>;
  synced_at: string;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  salesforce_id?: string;
  project_id: string;
  uploaded_by_customer_id: string;
  file_name: string;
  file_type?: string;
  file_size?: number;
  storage_path: string;
  salesforce_content_document_id?: string;
  description?: string;
  sync_status: 'pending' | 'synced' | 'failed';
  sync_error?: string;
  uploaded_at: string;
  synced_to_salesforce_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Leistungsnachweis {
  id: string;
  salesforce_id: string;
  project_id: string;
  record_number?: string;
  title: string;
  description?: string;
  service_date?: string;
  hours?: number;
  amount?: number;
  status?: string;
  performed_by?: string;
  approved?: boolean;
  approved_by?: string;
  approved_at?: string;
  attachment_url?: string;
  salesforce_data?: Record<string, any>;
  synced_at: string;
  created_at: string;
  updated_at: string;
}
