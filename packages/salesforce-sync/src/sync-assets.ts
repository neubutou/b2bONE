import { supabase, type Asset, type SyncLog } from './lib/supabase-client.js';
import { SalesforceClient } from './lib/salesforce-client.js';

/**
 * Sync pending assets to Salesforce
 * Downloads files from Supabase Storage and uploads to Salesforce as ContentVersion
 */
export async function syncAssetsToSalesforce(): Promise<SyncLog> {
  const startTime = Date.now();
  const startedAt = new Date();

  let recordsProcessed = 0;
  let recordsCreated = 0;
  let recordsUpdated = 0;
  let recordsFailed = 0;
  let errorMessage: string | undefined;

  console.log('🔄 Starting Assets sync to Salesforce...');

  try {
    // Get pending assets (not yet synced to Salesforce)
    const { data: pendingAssets, error: fetchError } = await supabase
      .from('assets')
      .select(`
        *,
        project:projects!inner(salesforce_id)
      `)
      .eq('sync_status', 'pending')
      .limit(100);

    if (fetchError) {
      throw fetchError;
    }

    if (!pendingAssets || pendingAssets.length === 0) {
      console.log('✅ No pending assets to sync');
      return {
        sync_type: 'assets',
        status: 'success',
        records_processed: 0,
        records_created: 0,
        records_updated: 0,
        records_failed: 0,
        sync_duration_ms: Date.now() - startTime,
        started_at: startedAt,
        completed_at: new Date(),
      };
    }

    console.log(`📊 Found ${pendingAssets.length} pending assets to sync`);

    recordsProcessed = pendingAssets.length;

    // Process each asset
    for (const asset of pendingAssets) {
      try {
        console.log(`📤 Uploading asset: ${asset.file_name}`);

        // Download file from Supabase Storage
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('project-assets')
          .download(asset.storage_path);

        if (downloadError || !fileData) {
          throw new Error(`Failed to download file: ${downloadError?.message}`);
        }

        // Convert to Base64
        const arrayBuffer = await fileData.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');

        // Get project's Salesforce ID
        const projectSalesforceId = (asset as any).project?.salesforce_id;

        if (!projectSalesforceId) {
          throw new Error('Project Salesforce ID not found');
        }

        // Upload to Salesforce
        const contentDocumentId = await SalesforceClient.uploadFile(
          asset.file_name,
          asset.file_name,
          base64Data,
          projectSalesforceId
        );

        // Update asset record
        const { error: updateError } = await supabase
          .from('assets')
          .update({
            salesforce_content_document_id: contentDocumentId,
            sync_status: 'synced',
            synced_to_salesforce_at: new Date().toISOString(),
            sync_error: null,
          })
          .eq('id', asset.id);

        if (updateError) {
          throw updateError;
        }

        recordsCreated++;
        console.log(`✅ Synced asset: ${asset.file_name}`);
      } catch (error) {
        console.error(`❌ Error syncing asset ${asset.id}:`, error);

        // Mark as failed
        await supabase
          .from('assets')
          .update({
            sync_status: 'failed',
            sync_error: error instanceof Error ? error.message : String(error),
          })
          .eq('id', asset.id);

        recordsFailed++;
      }
    }

    const completedAt = new Date();
    const syncDuration = Date.now() - startTime;

    const status = recordsFailed > 0 ? 'partial' : 'success';

    console.log(`✅ Sync completed: ${recordsCreated} synced, ${recordsFailed} failed`);

    return {
      sync_type: 'assets',
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
      sync_type: 'assets',
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
  syncAssetsToSalesforce()
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
