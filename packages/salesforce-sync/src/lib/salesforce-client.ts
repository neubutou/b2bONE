import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';

dotenv.config();

const execAsync = promisify(exec);

const SALESFORCE_ORG_ALIAS = process.env.SALESFORCE_ORG_ALIAS || 'production';
const API_VERSION = process.env.SALESFORCE_API_VERSION || '59.0';

export class SalesforceClient {
  /**
   * Execute SOQL Query via Salesforce CLI
   */
  static async query<T = any>(soql: string): Promise<T[]> {
    try {
      const command = `sf data query --query "${soql.replace(/"/g, '\\"')}" --target-org ${SALESFORCE_ORG_ALIAS} --json`;

      const { stdout, stderr } = await execAsync(command);

      if (stderr) {
        console.error('Salesforce CLI stderr:', stderr);
      }

      const result = JSON.parse(stdout);

      if (result.status !== 0) {
        throw new Error(`Salesforce query failed: ${result.message}`);
      }

      return result.result.records || [];
    } catch (error) {
      console.error('Salesforce query error:', error);
      throw error;
    }
  }

  /**
   * Get all Opportunities with related Account info
   */
  static async getOpportunities(lastSyncDate?: Date): Promise<any[]> {
    let whereClause = '';
    if (lastSyncDate) {
      const isoDate = lastSyncDate.toISOString();
      whereClause = `WHERE LastModifiedDate > ${isoDate}`;
    }

    const soql = `
      SELECT
        Id,
        Name,
        AccountId,
        Account.Name,
        StageName,
        Amount,
        CloseDate,
        Probability,
        Description,
        Owner.Name,
        LastModifiedDate
      FROM Opportunity
      ${whereClause}
      ORDER BY LastModifiedDate DESC
      LIMIT 1000
    `;

    return this.query(soql);
  }

  /**
   * Get Custom Object (Projects)
   * Anpassen an Ihre Custom Object API Namen
   */
  static async getProjects(objectApiName: string, lastSyncDate?: Date): Promise<any[]> {
    let whereClause = '';
    if (lastSyncDate) {
      const isoDate = lastSyncDate.toISOString();
      whereClause = `WHERE LastModifiedDate > ${isoDate}`;
    }

    // ACHTUNG: Feldnamen anpassen an Ihre Custom Objects!
    const soql = `
      SELECT
        Id,
        Name,
        Account__c,
        Opportunity__c,
        ProjectNumber__c,
        Status__c,
        StartDate__c,
        EndDate__c,
        Budget__c,
        Description__c,
        LastModifiedDate
      FROM ${objectApiName}
      ${whereClause}
      ORDER BY LastModifiedDate DESC
      LIMIT 1000
    `;

    return this.query(soql);
  }

  /**
   * Get Service Records / Leistungsnachweise
   */
  static async getLeistungsnachweise(objectApiName: string, lastSyncDate?: Date): Promise<any[]> {
    let whereClause = '';
    if (lastSyncDate) {
      const isoDate = lastSyncDate.toISOString();
      whereClause = `WHERE LastModifiedDate > ${isoDate}`;
    }

    // ACHTUNG: Feldnamen anpassen an Ihre Custom Objects!
    const soql = `
      SELECT
        Id,
        Name,
        Project__c,
        RecordNumber__c,
        Title__c,
        Description__c,
        ServiceDate__c,
        Hours__c,
        Amount__c,
        Status__c,
        PerformedBy__c,
        Approved__c,
        ApprovedBy__c,
        ApprovedDate__c,
        AttachmentURL__c,
        LastModifiedDate
      FROM ${objectApiName}
      ${whereClause}
      ORDER BY LastModifiedDate DESC
      LIMIT 1000
    `;

    return this.query(soql);
  }

  /**
   * Upload File to Salesforce (ContentVersion)
   */
  static async uploadFile(
    title: string,
    pathOnClient: string,
    versionData: string, // Base64 encoded
    linkedEntityId: string // Project/Record ID to link to
  ): Promise<string> {
    try {
      // Create ContentVersion via Salesforce CLI
      const createCommand = `sf data create record --sobject ContentVersion --values "Title='${title}' PathOnClient='${pathOnClient}' VersionData='${versionData}'" --target-org ${SALESFORCE_ORG_ALIAS} --json`;

      const { stdout } = await execAsync(createCommand);
      const result = JSON.parse(stdout);

      if (result.status !== 0) {
        throw new Error(`Failed to create ContentVersion: ${result.message}`);
      }

      const contentVersionId = result.result.id;

      // Get ContentDocumentId
      const queryDoc = await this.query<any>(`
        SELECT ContentDocumentId
        FROM ContentVersion
        WHERE Id = '${contentVersionId}'
      `);

      const contentDocumentId = queryDoc[0]?.ContentDocumentId;

      if (!contentDocumentId) {
        throw new Error('Failed to get ContentDocumentId');
      }

      // Link to Project/Record
      const linkCommand = `sf data create record --sobject ContentDocumentLink --values "ContentDocumentId='${contentDocumentId}' LinkedEntityId='${linkedEntityId}' ShareType='V'" --target-org ${SALESFORCE_ORG_ALIAS} --json`;

      await execAsync(linkCommand);

      return contentDocumentId;
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  }

  /**
   * Test Salesforce CLI Connection
   */
  static async testConnection(): Promise<boolean> {
    try {
      const command = `sf org display --target-org ${SALESFORCE_ORG_ALIAS} --json`;
      const { stdout } = await execAsync(command);
      const result = JSON.parse(stdout);
      return result.status === 0;
    } catch (error) {
      console.error('Salesforce connection test failed:', error);
      return false;
    }
  }
}
