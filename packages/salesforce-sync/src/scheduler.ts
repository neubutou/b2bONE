import cron from 'node-cron';
import { syncOpportunities } from './sync-opportunities.js';
import { syncProjects } from './sync-projects.js';
import { syncLeistungsnachweise } from './sync-leistungsnachweise.js';
import { syncAssetsToSalesforce } from './sync-assets.js';
import { supabase } from './lib/supabase-client.js';
import { SalesforceClient } from './lib/salesforce-client.js';
import dotenv from 'dotenv';

dotenv.config();

const SYNC_INTERVAL_HOURS = parseInt(process.env.SYNC_INTERVAL_HOURS || '4');

console.log(`
╔═══════════════════════════════════════════════════════════╗
║      B2B Portal - Salesforce Sync Scheduler               ║
║                                                           ║
║  Sync Interval: Every ${SYNC_INTERVAL_HOURS} hours                        ║
╚═══════════════════════════════════════════════════════════╝
`);

/**
 * Run all sync jobs
 */
async function runFullSync() {
  console.log('\n🚀 Starting full sync cycle...\n');

  try {
    // Test Salesforce connection
    console.log('🔌 Testing Salesforce connection...');
    const isConnected = await SalesforceClient.testConnection();

    if (!isConnected) {
      console.error('❌ Salesforce connection failed. Please check your credentials.');
      return;
    }

    console.log('✅ Salesforce connection OK\n');

    // 1. Sync Opportunities
    console.log('📊 Syncing Opportunities...');
    const oppLog = await syncOpportunities();
    await supabase.from('sync_logs').insert(oppLog);
    console.log('');

    // 2. Sync Projects
    console.log('📁 Syncing Projects...');
    const projectLog = await syncProjects();
    await supabase.from('sync_logs').insert(projectLog);
    console.log('');

    // 3. Sync Leistungsnachweise
    console.log('📋 Syncing Leistungsnachweise...');
    const leistungLog = await syncLeistungsnachweise();
    await supabase.from('sync_logs').insert(leistungLog);
    console.log('');

    // 4. Sync Assets to Salesforce
    console.log('📤 Syncing Assets to Salesforce...');
    const assetLog = await syncAssetsToSalesforce();
    await supabase.from('sync_logs').insert(assetLog);
    console.log('');

    console.log('✅ Full sync cycle completed!\n');
    console.log('Summary:');
    console.log(`  Opportunities: ${oppLog.records_created} created, ${oppLog.records_updated} updated`);
    console.log(`  Projects: ${projectLog.records_created} created, ${projectLog.records_updated} updated`);
    console.log(`  Leistungsnachweise: ${leistungLog.records_created} created, ${leistungLog.records_updated} updated`);
    console.log(`  Assets: ${assetLog.records_created} synced to Salesforce`);
    console.log('');
  } catch (error) {
    console.error('❌ Sync cycle failed:', error);
  }
}

/**
 * Schedule sync jobs
 */
function startScheduler() {
  // Run every X hours
  const cronSchedule = `0 */${SYNC_INTERVAL_HOURS} * * *`;

  console.log(`⏰ Scheduler started. Cron: ${cronSchedule}`);
  console.log(`   Next sync in ${SYNC_INTERVAL_HOURS} hours\n`);

  cron.schedule(cronSchedule, () => {
    console.log(`⏰ Scheduled sync triggered at ${new Date().toISOString()}`);
    runFullSync();
  });

  // Run immediately on start
  console.log('🔄 Running initial sync...\n');
  runFullSync();
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Scheduler shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Scheduler shutting down...');
  process.exit(0);
});

// Start the scheduler
startScheduler();
