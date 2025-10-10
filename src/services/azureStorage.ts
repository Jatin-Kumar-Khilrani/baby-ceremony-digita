// Azure Storage Service for Baby Ceremony Digital App
// This service handles all interactions with Azure Blob Storage using REST API

interface AzureStorageConfig {
  accountName: string;
  containerName: string;
  sasToken: string;
}

interface StorageData {
  [key: string]: any;
}

class AzureStorageService {
  private config: AzureStorageConfig;
  private baseUrl: string;

  constructor() {
    // Extract storage account name from connection string or use direct env var
    const connectionString = import.meta.env.VITE_AZURE_STORAGE_CONNECTION_STRING || '';
    const accountMatch = connectionString.match(/AccountName=([^;]+)/);
    
    this.config = {
      accountName: accountMatch?.[1] || import.meta.env.VITE_AZURE_STORAGE_ACCOUNT_NAME || '',
      containerName: import.meta.env.VITE_AZURE_STORAGE_CONTAINER || 'ceremony-data',
      sasToken: import.meta.env.VITE_AZURE_SAS_TOKEN || ''
    };
    
    this.baseUrl = `https://${this.config.accountName}.blob.core.windows.net/${this.config.containerName}`;
  }

  private isConfigured(): boolean {
    return !!(this.config.accountName && this.config.containerName);
  }

  // Save data to Azure Blob Storage
  async saveData(key: string, data: any): Promise<void> {
    if (!this.isConfigured()) {
      console.warn('Azure Storage not configured, falling back to localStorage');
      localStorage.setItem(key, JSON.stringify(data));
      return;
    }

    try {
      const blobName = `${key}.json`;
      const jsonData = JSON.stringify(data, null, 2);
      
      const url = this.config.sasToken 
        ? `${this.baseUrl}/${blobName}?${this.config.sasToken}`
        : `${this.baseUrl}/${blobName}`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-ms-blob-type': 'BlockBlob',
          'x-ms-version': '2020-04-08'
        },
        body: jsonData
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error saving to Azure Storage:', error);
      // Fallback to localStorage for development/offline scenarios
      localStorage.setItem(key, JSON.stringify(data));
    }
  }

  // Load data from Azure Blob Storage
  async loadData<T>(key: string, defaultValue: T): Promise<T> {
    if (!this.isConfigured()) {
      console.warn('Azure Storage not configured, falling back to localStorage');
      const localData = localStorage.getItem(key);
      if (localData) {
        try {
          return JSON.parse(localData) as T;
        } catch {
          return defaultValue;
        }
      }
      return defaultValue;
    }

    try {
      const blobName = `${key}.json`;
      const url = this.config.sasToken 
        ? `${this.baseUrl}/${blobName}?${this.config.sasToken}`
        : `${this.baseUrl}/${blobName}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-ms-version': '2020-04-08'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Also cache in localStorage for offline access
        localStorage.setItem(key, JSON.stringify(data));
        return data as T;
      } else if (response.status === 404) {
        // Blob doesn't exist, return default value
        return defaultValue;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error loading from Azure Storage:', error);
      // Fallback to localStorage
      const localData = localStorage.getItem(key);
      if (localData) {
        try {
          return JSON.parse(localData) as T;
        } catch {
          return defaultValue;
        }
      }
      return defaultValue;
    }
  }

  // Upload file (for photos)
  async uploadFile(file: File, fileName: string): Promise<string> {
    if (!this.isConfigured()) {
      console.warn('Azure Storage not configured, using base64 fallback');
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    try {
      const blobName = `photos/${fileName}`;
      const url = this.config.sasToken 
        ? `${this.baseUrl}/${blobName}?${this.config.sasToken}`
        : `${this.baseUrl}/${blobName}`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
          'x-ms-blob-type': 'BlockBlob',
          'x-ms-version': '2020-04-08'
        },
        body: file
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Return the public URL of the uploaded file
      return `${this.baseUrl}/${blobName}`;
    } catch (error) {
      console.error('Error uploading file to Azure Storage:', error);
      // Fallback to base64 encoding for local storage
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
  }

  // Delete data
  async deleteData(key: string): Promise<void> {
    if (!this.isConfigured()) {
      localStorage.removeItem(key);
      return;
    }

    try {
      const blobName = `${key}.json`;
      const url = this.config.sasToken 
        ? `${this.baseUrl}/${blobName}?${this.config.sasToken}`
        : `${this.baseUrl}/${blobName}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'x-ms-version': '2020-04-08'
        }
      });

      if (!response.ok && response.status !== 404) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting from Azure Storage:', error);
      // Fallback to localStorage
      localStorage.removeItem(key);
    }
  }

  // Get status of Azure Storage connection
  getStatus(): { configured: boolean; accountName: string; container: string } {
    return {
      configured: this.isConfigured(),
      accountName: this.config.accountName,
      container: this.config.containerName
    };
  }
}

// Export singleton instance
export const azureStorage = new AzureStorageService();

// Make it globally available for the storage hooks
if (typeof window !== 'undefined') {
  window.azureStorage = azureStorage;
}

export default azureStorage;