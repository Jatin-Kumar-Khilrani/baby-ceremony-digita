// Migration utility to move data from localStorage to Azure Storage
// This utility works without any Spark dependencies

interface MigrationStatus {
  key: string;
  status: 'success' | 'error' | 'skipped';
  message: string;
}

interface AzureStorageService {
  loadData: <T>(key: string, defaultValue: T) => Promise<T>;
  saveData: (key: string, data: any) => Promise<void>;
  getStatus: () => { configured: boolean; accountName: string; container: string };
}

export class StorageMigration {
  
  private getAzureStorage(): AzureStorageService | null {
    if (typeof window !== 'undefined' && window.azureStorage) {
      return window.azureStorage as unknown as AzureStorageService;
    }
    return null;
  }

  // Get all localStorage keys that should be migrated
  private getLocalStorageKeys(): string[] {
    const keys: string[] = [];
    const targetKeys = ['ceremony-rsvps', 'ceremony-wishes', 'ceremony-photos'];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && targetKeys.includes(key)) {
        keys.push(key);
      }
    }
    
    return keys;
  }

  // Migrate a single key from localStorage to Azure Storage
  async migrateKey(key: string): Promise<MigrationStatus> {
    const azureStorage = this.getAzureStorage();
    
    if (!azureStorage) {
      return {
        key,
        status: 'error',
        message: 'Azure Storage not available'
      };
    }

    try {
      const localData = localStorage.getItem(key);
      
      if (!localData) {
        return {
          key,
          status: 'skipped',
          message: 'No data found in localStorage'
        };
      }

      let parsedData;
      try {
        parsedData = JSON.parse(localData);
      } catch (error) {
        return {
          key,
          status: 'error',
          message: 'Failed to parse localStorage data'
        };
      }

      // Save to Azure Storage
      await azureStorage.saveData(key, parsedData);
      
      return {
        key,
        status: 'success',
        message: `Migrated ${Array.isArray(parsedData) ? parsedData.length : 1} items`
      };
      
    } catch (error) {
      return {
        key,
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Migrate all ceremony data from localStorage to Azure Storage
  async migrateAll(): Promise<MigrationStatus[]> {
    const keys = this.getLocalStorageKeys();
    const results: MigrationStatus[] = [];
    
    console.log(`Starting migration of ${keys.length} keys to Azure Storage...`);
    
    for (const key of keys) {
      console.log(`Migrating ${key}...`);
      const result = await this.migrateKey(key);
      results.push(result);
      
      if (result.status === 'success') {
        console.log(`✅ ${key}: ${result.message}`);
      } else if (result.status === 'error') {
        console.error(`❌ ${key}: ${result.message}`);
      } else {
        console.log(`⏭️  ${key}: ${result.message}`);
      }
    }
    
    return results;
  }

  // Verify migration by comparing localStorage and Azure Storage data
  async verifyMigration(): Promise<{ [key: string]: boolean }> {
    const azureStorage = this.getAzureStorage();
    const keys = this.getLocalStorageKeys();
    const results: { [key: string]: boolean } = {};
    
    if (!azureStorage) {
      console.error('Azure Storage not available for verification');
      return {};
    }
    
    for (const key of keys) {
      try {
        const localData = localStorage.getItem(key);
        const azureData = await azureStorage.loadData(key, null);
        
        if (!localData && !azureData) {
          results[key] = true; // Both empty
          continue;
        }
        
        if (!localData || !azureData) {
          results[key] = false; // One is empty
          continue;
        }
        
        const parsedLocal = JSON.parse(localData);
        const localJson = JSON.stringify(parsedLocal);
        const azureJson = JSON.stringify(azureData);
        
        results[key] = localJson === azureJson;
        
      } catch (error) {
        console.error(`Error verifying ${key}:`, error);
        results[key] = false;
      }
    }
    
    return results;
  }

  // Check Azure Storage configuration
  checkConfiguration(): { isConfigured: boolean; status: any } {
    const azureStorage = this.getAzureStorage();
    
    if (!azureStorage || typeof azureStorage.getStatus !== 'function') {
      return {
        isConfigured: false,
        status: { error: 'Azure Storage service not available' }
      };
    }
    
    const status = azureStorage.getStatus();
    
    return {
      isConfigured: status.configured,
      status
    };
  }

  // Get migration statistics
  async getMigrationStats(): Promise<{
    localStorage: { [key: string]: number };
    azureStorage: { [key: string]: number };
  }> {
    const azureStorage = this.getAzureStorage();
    const keys = ['ceremony-rsvps', 'ceremony-wishes', 'ceremony-photos'];
    const stats = {
      localStorage: {} as { [key: string]: number },
      azureStorage: {} as { [key: string]: number }
    };
    
    for (const key of keys) {
      // Count localStorage items
      const localData = localStorage.getItem(key);
      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          stats.localStorage[key] = Array.isArray(parsed) ? parsed.length : 1;
        } catch {
          stats.localStorage[key] = 0;
        }
      } else {
        stats.localStorage[key] = 0;
      }
      
      // Count Azure Storage items
      if (azureStorage) {
        try {
          const azureData = await azureStorage.loadData(key, []);
          stats.azureStorage[key] = Array.isArray(azureData) ? azureData.length : (azureData ? 1 : 0);
        } catch {
          stats.azureStorage[key] = 0;
        }
      } else {
        stats.azureStorage[key] = 0;
      }
    }
    
    return stats;
  }
}

// Export singleton instance
export const storageMigration = new StorageMigration();

// Utility function for manual migration (can be called from browser console)
export const runMigration = async () => {
  console.log('🚀 Starting Azure Storage Migration...');
  
  // Check configuration
  const config = storageMigration.checkConfiguration();
  if (!config.isConfigured) {
    console.error('❌ Azure Storage is not configured properly');
    console.log('Configuration status:', config.status);
    return;
  }
  
  console.log('✅ Azure Storage configuration validated');
  
  // Get stats before migration
  const statsBefore = await storageMigration.getMigrationStats();
  console.log('📊 Data before migration:', statsBefore);
  
  // Run migration
  const results = await storageMigration.migrateAll();
  
  // Get stats after migration
  const statsAfter = await storageMigration.getMigrationStats();
  console.log('📊 Data after migration:', statsAfter);
  
  // Verify migration
  const verification = await storageMigration.verifyMigration();
  console.log('🔍 Migration verification:', verification);
  
  // Summary
  const successful = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status === 'error').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  
  console.log(`\n📋 Migration Summary:`);
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  
  if (failed === 0) {
    console.log('🎉 Migration completed successfully!');
  } else {
    console.log('⚠️  Migration completed with some errors. Check logs above.');
  }
  
  return {
    results,
    statsBefore,
    statsAfter,
    verification
  };
};

export default storageMigration;