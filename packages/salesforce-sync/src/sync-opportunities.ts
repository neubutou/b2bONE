import { supabase, type Opportunity, type SyncLog } from './lib/supabase-client.js';
import { SalesforceClient } from './lib/salesforce-client.js';

export async function syncOpportunities(): Promise<SyncLog> {
  const startTime = Date.now();
  const startedAt = new Date();

  let recordsProcessed = 0;
  let recordsCreated = 0;
  let recordsUpdated = 0;
  let recordsFailed = 0;
  let errorMessage: string | undefined;

  console.log('🔄 Starting Opportunities sync...');

  try {
    // Get last sync time
    const { data: lastSync } = await supabase
      .from('sync_logs')
      .select('completed_at')
      .eq('sync_type', 'opportunities')
      .eq('status', 'success')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    const lastSyncDate = lastSync?.completed_at ? new Date(lastSync.completed_at) : undefined;

    console.log(`📅 Last sync: ${lastSyncDate?.toISOString() || 'Never'}`);

    // Fetch opportunities from Salesforce
    const sfOpportunities = await SalesforceClient.getOpportunities(lastSyncDate);

    console.log(`📊 Found ${sfOpportunities.length} opportunities to sync`);

    recordsProcessed = sfOpportunities.length;

    // Process each opportunity
    for (const sfOpp of sfOpportunities) {
      try {
        // Find or create customer
        const { data: customer } = await supabase
          .from('customers')
          .select('id')
          .eq('salesforce_account_id', sfOpp.AccountId)
          .single();

        if (!customer) {
          console.warn(`⚠️  Customer not found for Account ${sfOpp.AccountId}, skipping opportunity ${sfOpp.Id}`);
          recordsFailed++;
          continue;
        }

        // Check if opportunity exists
        const { data: existing } = await supabase
          .from('opportunities')
          .select('id')
          .eq('salesforce_id', sfOpp.Id)
          .single();

        const opportunityData: Opportunity = {
          salesforce_id: sfOpp.Id,
          customer_id: customer.id,
          name: sfOpp.Name,
          stage: sfOpp.StageName,
          amount: sfOpp.Amount,
          close_date: sfOpp.CloseDate,
          probability: sfOpp.Probability,
          description: sfOpp.Description,
          owner_name: sfOpp.Owner?.Name,
          salesforce_data: {
            account_name: sfOpp.Account?.Name,
            last_modified: sfOpp.LastModifiedDate,
          },
        };

        if (existing) {
          // Update
          const { error } = await supabase
            .from('opportunities')
            .update(opportunityData)
            .eq('id', existing.id);

          if (error) {
            console.error(`❌ Error updating opportunity ${sfOpp.Id}:`, error);
            recordsFailed++;
          } else {
            recordsUpdated++;
            console.log(`✅ Updated opportunity: ${sfOpp.Name}`);
          }
        } else {
          // Create
          const { error } = await supabase
            .from('opportunities')
            .insert(opportunityData);

          if (error) {
            console.error(`❌ Error creating opportunity ${sfOpp.Id}:`, error);
            recordsFailed++;
          } else {
            recordsCreated++;
            console.log(`✨ Created opportunity: ${sfOpp.Name}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error processing opportunity ${sfOpp.Id}:`, error);
        recordsFailed++;
      }
    }

    const completedAt = new Date();
    const syncDuration = Date.now() - startTime;

    const status = recordsFailed > 0 ? 'partial' : 'success';

    console.log(`✅ Sync completed: ${recordsCreated} created, ${recordsUpdated} updated, ${recordsFailed} failed`);

    return {
      sync_type: 'opportunities',
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
      sync_type: 'opportunities',
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
  syncOpportunities()
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
