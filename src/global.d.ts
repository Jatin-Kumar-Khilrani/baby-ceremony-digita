// Global type declarations

import { AzureStorageService } from './services/azureStorage';

declare global {
  interface Window {
    azureStorage?: AzureStorageService;
  }
}

export {};
