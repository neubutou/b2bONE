import { supabase, type Leistungsnachweis, type SyncLog } from './lib/supabase-client.js';
import { SalesforceClient } from './lib/salesforce-client.js';

const LEISTUNGSNACHWEIS_OBJECT_API_NAME = process.env.SALESFORCE_LEISTUNGSNACHWEIS_OBJECT || 'ServiceRecord__c';

export async function syncLeistungsnachweise(): Promise<SyncLog> {
  const startTime = Date.now();
  const startedAt = new Date();

  let recordsProcessed = 0;
  let recordsCreated = 0;
  let recordsUpdated = 0;
  let recordsFailed = 0;
  let errorMessage: string | undefined;

  console.log('🔄 Starting Leistungsnachweise sync...');

  try {
    // Get last sync time
    const { data: lastSync } = await supabase
      .from('sync_logs')
      .select('completed_at')
      .eq('sync_type', 'leistungsnachweise')
      .eq('status', 'success')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    const lastSyncDate = lastSync?.completed_at ? new Date(lastSync.completed_at) : undefined;

    console.log(`📅 Last sync: ${lastSyncDate?.toISOString() || 'Never'}`);

    // Fetch from Salesforce
    const sfRecords = await SalesforceClient.getLeistungsnachweise(
      LEISTUNGSNACHWEIS_OBJECT_API_NAME,
      lastSyncDate
    );

    console.log(`📊 Found ${sfRecords.length} leistungsnachweise to sync`);

    recordsProcessed = sfRecords.length;

    // Process each record
    for (const sfRecord of sfRecords) {
      try {
        // Find project
        const { data: project } = await supabase
          .from('projects')
          .select('id')
          .eq('salesforce_id', sfRecord.Project__c)
          .single();

        if (!project) {
          console.warn(`⚠️  Project not found for ${sfRecord.Project__c}, skipping record ${sfRecord.Id}`);
          recordsFailed++;
          continue;
        }

        // Check if record exists
        const { data: existing } = await supabase
          .from('leistungsnachweise')
          .select('id')
          .eq('salesforce_id', sfRecord.Id)
          .single();

        const recordData: Leistungsnachweis = {
          salesforce_id: sfRecord.Id,
          project_id: project.id,
          record_number: sfRecord.RecordNumber__c,
          title: sfRecord.Title__c || sfRecord.Name,
          description: sfRecord.Description__c,
          service_date: sfRecord.ServiceDate__c,
          hours: sfRecord.Hours__c,
          amount: sfRecord.Amount__c,
          status: sfRecord.Status__c,
          performed_by: sfRecord.PerformedBy__c,
          approved: sfRecord.Approved__c,
          approved_by: sfRecord.ApprovedBy__c,
          approved_at: sfRecord.ApprovedDate__c,
          attachment_url: sfRecord.AttachmentURL__c,
          salesforce_data: {
            last_modified: sfRecord.LastModifiedDate,
          },
        };

        if (existing) {
          // Update
          const { error } = await supabase
            .from('leistungsnachweise')
            .update(recordData)
            .eq('id', existing.id);

          if (error) {
            console.error(`❌ Error updating record ${sfRecord.Id}:`, error);
            recordsFailed++;
          } else {
            recordsUpdated++;
            console.log(`✅ Updated leistungsnachweis: ${sfRecord.Name}`);
          }
        } else {
          // Create
          const { error } = await supabase
            .from('leistungsnachweise')
            .insert(recordData);

          if (error) {
            console.error(`❌ Error creating record ${sfRecord.Id}:`, error);
            recordsFailed++;
          } else {
            recordsCreated++;
            console.log(`✨ Created leistungsnachweis: ${sfRecord.Name}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error processing record ${sfRecord.Id}:`, error);
        recordsFailed++;
      }
    }

    const completedAt = new Date();
    const syncDuration = Date.now() - startTime;

    const status = recordsFailed > 0 ? 'partial' : 'success';

    console.log(`✅ Sync completed: ${recordsCreated} created, ${recordsUpdated} updated, ${recordsFailed} failed`);

    return {
      sync_type: 'leistungsnachweise',
      status,
      records_processed: recordsProcessed,
      records_created: recordsCreated,
      records_updated: recordsUpdated,
      records_failed: recordsFailed,
      sync_duration_ms: syncDuration,
      started_at: startedAt,
      completed_at: completedAt,
    };
  } catch (error) {
    console.error('❌ Sync failed:', error);
    errorMessage = error instanceof Error ? error.message : String(error);

    return {
      sync_type: 'leistungsnachweise',
      status: 'failed',
      records_processed: recordsProcessed,
      records_created: recordsCreated,
      records_updated: recordsUpdated,
      records_failed: recordsFailed,
      error_message: errorMessage,
      sync_duration_ms: Date.now() - startTime,
      started_at: startedAt,
      completed_at: new Date(),
    };
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  syncLeistungsnachweise()
    .then(async (log) => {
      await supabase.from('sync_logs').insert(log);
      console.log('📝 Sync log saved');
      process.exit(log.status === 'failed' ? 1 : 0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
