import { supabase, type Project, type SyncLog } from './lib/supabase-client.js';
import { SalesforceClient } from './lib/salesforce-client.js';

const PROJECT_OBJECT_API_NAME = process.env.SALESFORCE_PROJECT_OBJECT || 'Project__c';

export async function syncProjects(): Promise<SyncLog> {
  const startTime = Date.now();
  const startedAt = new Date();

  let recordsProcessed = 0;
  let recordsCreated = 0;
  let recordsUpdated = 0;
  let recordsFailed = 0;
  let errorMessage: string | undefined;

  console.log('🔄 Starting Projects sync...');

  try {
    // Get last sync time
    const { data: lastSync } = await supabase
      .from('sync_logs')
      .select('completed_at')
      .eq('sync_type', 'projects')
      .eq('status', 'success')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    const lastSyncDate = lastSync?.completed_at ? new Date(lastSync.completed_at) : undefined;

    console.log(`📅 Last sync: ${lastSyncDate?.toISOString() || 'Never'}`);

    // Fetch projects from Salesforce
    const sfProjects = await SalesforceClient.getProjects(PROJECT_OBJECT_API_NAME, lastSyncDate);

    console.log(`📊 Found ${sfProjects.length} projects to sync`);

    recordsProcessed = sfProjects.length;

    // Process each project
    for (const sfProject of sfProjects) {
      try {
        // Find customer by Account
        const { data: customer } = await supabase
          .from('customers')
          .select('id')
          .eq('salesforce_account_id', sfProject.Account__c)
          .single();

        if (!customer) {
          console.warn(`⚠️  Customer not found for Account ${sfProject.Account__c}, skipping project ${sfProject.Id}`);
          recordsFailed++;
          continue;
        }

        // Find opportunity if linked
        let opportunityId: string | undefined;
        if (sfProject.Opportunity__c) {
          const { data: opportunity } = await supabase
            .from('opportunities')
            .select('id')
            .eq('salesforce_id', sfProject.Opportunity__c)
            .single();

          opportunityId = opportunity?.id;
        }

        // Check if project exists
        const { data: existing } = await supabase
          .from('projects')
          .select('id')
          .eq('salesforce_id', sfProject.Id)
          .single();

        const projectData: Project = {
          salesforce_id: sfProject.Id,
          customer_id: customer.id,
          opportunity_id: opportunityId,
          project_number: sfProject.ProjectNumber__c,
          name: sfProject.Name,
          status: sfProject.Status__c,
          start_date: sfProject.StartDate__c,
          end_date: sfProject.EndDate__c,
          budget: sfProject.Budget__c,
          description: sfProject.Description__c,
          salesforce_data: {
            last_modified: sfProject.LastModifiedDate,
          },
        };

        if (existing) {
          // Update
          const { error } = await supabase
            .from('projects')
            .update(projectData)
            .eq('id', existing.id);

          if (error) {
            console.error(`❌ Error updating project ${sfProject.Id}:`, error);
            recordsFailed++;
          } else {
            recordsUpdated++;
            console.log(`✅ Updated project: ${sfProject.Name}`);
          }
        } else {
          // Create
          const { error } = await supabase
            .from('projects')
            .insert(projectData);

          if (error) {
            console.error(`❌ Error creating project ${sfProject.Id}:`, error);
            recordsFailed++;
          } else {
            recordsCreated++;
            console.log(`✨ Created project: ${sfProject.Name}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error processing project ${sfProject.Id}:`, error);
        recordsFailed++;
      }
    }

    const completedAt = new Date();
    const syncDuration = Date.now() - startTime;

    const status = recordsFailed > 0 ? 'partial' : 'success';

    console.log(`✅ Sync completed: ${recordsCreated} created, ${recordsUpdated} updated, ${recordsFailed} failed`);

    return {
      sync_type: 'projects',
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
      sync_type: 'projects',
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
  syncProjects()
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
