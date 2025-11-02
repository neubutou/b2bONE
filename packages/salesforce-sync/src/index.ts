#!/usr/bin/env node

import { syncOpportunities } from './sync-opportunities.js';
import { syncProjects } from './sync-projects.js';
import { syncLeistungsnachweise } from './sync-leistungsnachweise.js';
import { syncAssetsToSalesforce } from './sync-assets.js';
import { supabase } from './lib/supabase-client.js';

const args = process.argv.slice(2);
const command = args[0];

async function main() {
  console.log('B2B Portal - Salesforce Sync CLI\n');

  switch (command) {
    case 'opportunities':
      console.log('📊 Syncing Opportunities...\n');
      const oppLog = await syncOpportunities();
      await supabase.from('sync_logs').insert(oppLog);
      console.log('\n✅ Done!');
      break;

    case 'projects':
      console.log('📁 Syncing Projects...\n');
      const projectLog = await syncProjects();
      await supabase.from('sync_logs').insert(projectLog);
      console.log('\n✅ Done!');
      break;

    case 'leistungsnachweise':
      console.log('📋 Syncing Leistungsnachweise...\n');
      const leistungLog = await syncLeistungsnachweise();
      await supabase.from('sync_logs').insert(leistungLog);
      console.log('\n✅ Done!');
      break;

    case 'assets':
      console.log('📤 Syncing Assets to Salesforce...\n');
      const assetLog = await syncAssetsToSalesforce();
      await supabase.from('sync_logs').insert(assetLog);
      console.log('\n✅ Done!');
      break;

    case 'all':
      console.log('🚀 Running full sync...\n');
      const oLog = await syncOpportunities();
      await supabase.from('sync_logs').insert(oLog);

      const pLog = await syncProjects();
      await supabase.from('sync_logs').insert(pLog);

      const lLog = await syncLeistungsnachweise();
      await supabase.from('sync_logs').insert(lLog);

      const aLog = await syncAssetsToSalesforce();
      await supabase.from('sync_logs').insert(aLog);

      console.log('\n✅ Full sync completed!');
      break;

    default:
      console.log(`
Usage: npm run sync <command>

Commands:
  opportunities       Sync Salesforce Opportunities
  projects           Sync Salesforce Projects (Custom Object)
  leistungsnachweise Sync Leistungsnachweise (Service Records)
  assets             Sync pending assets to Salesforce
  all                Run all sync jobs

Examples:
  npm run sync opportunities
  npm run sync all
      `);
      process.exit(1);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
