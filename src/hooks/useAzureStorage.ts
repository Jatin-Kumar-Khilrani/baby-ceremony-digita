import { useState, useEffect, useCallback } from 'react'
import azureStorage from '../services/azureStorage'

// Custom hook to replace useKV with Azure Storage
export function useAzureStorage<T>(key: string, defaultValue: T): [T, (updater: T | ((prev: T) => T)) => void] {
  const [data, setData] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);

  // Load data from Azure Storage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const loadedData = await azureStorage.loadData(key, defaultValue);
        setData(loadedData);
      } catch (error) {
        console.error(`Failed to load data for key ${key}:`, error);
        setData(defaultValue);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [key, defaultValue]);

  // Save data to Azure Storage when data changes
  const updateData = useCallback(async (updater: T | ((prev: T) => T)) => {
    try {
      const newData = typeof updater === 'function' ? (updater as (prev: T) => T)(data) : updater;
      setData(newData);
      await azureStorage.saveData(key, newData);
    } catch (error) {
      console.error(`Failed to save data for key ${key}:`, error);
      // Still update local state even if save fails
      const newData = typeof updater === 'function' ? (updater as (prev: T) => T)(data) : updater;
      setData(newData);
    }
  }, [key, data]);

  return [data, updateData];
}

// Hook with loading state for better UX
export function useAzureStorageWithLoading<T>(key: string, defaultValue: T): [T, (updater: T | ((prev: T) => T)) => void, boolean] {
  const [data, setData] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const loadedData = await azureStorage.loadData(key, defaultValue);
        setData(loadedData);
      } catch (error) {
        console.error(`Failed to load data for key ${key}:`, error);
        setData(defaultValue);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [key, defaultValue]);

  const updateData = useCallback(async (updater: T | ((prev: T) => T)) => {
    try {
      const newData = typeof updater === 'function' ? (updater as (prev: T) => T)(data) : updater;
      setData(newData);
      await azureStorage.saveData(key, newData);
    } catch (error) {
      console.error(`Failed to save data for key ${key}:`, error);
      const newData = typeof updater === 'function' ? (updater as (prev: T) => T)(data) : updater;
      setData(newData);
    }
  }, [key, data]);

  return [data, updateData, loading];
}

// Hook for file uploads specifically
export function useAzureFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadFile = useCallback(async (file: File, fileName: string): Promise<string> => {
    setUploading(true);
    setUploadProgress(0);
    
    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const url = await azureStorage.uploadFile(file, fileName);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      return url;
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, []);

  return {
    uploadFile,
    uploading,
    uploadProgress
  };
}