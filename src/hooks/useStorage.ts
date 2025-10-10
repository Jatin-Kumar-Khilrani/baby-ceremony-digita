import { useState, useEffect, useCallback, useRef } from 'react'

// API endpoint - will be /api in production (Azure Static Web Apps), localhost:7071 for local development
const API_BASE = import.meta.env.DEV ? 'http://localhost:7071/api' : '/api'

export function useStorage<T>(key: string, initialValue: T): [T | null, (value: T) => Promise<void>, boolean] {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Use ref to store initialValue to prevent infinite loops from inline arrays/objects
  const initialValueRef = useRef(initialValue)

  // Map storage keys to API endpoints
  const getEndpoint = (storageKey: string): string => {
    if (storageKey.includes('rsvp')) return `${API_BASE}/rsvps`
    if (storageKey.includes('wish')) return `${API_BASE}/wishes`
    if (storageKey.includes('photo')) return `${API_BASE}/photos`
    return ''
  }

  // Load data from API
  const loadData = useCallback(async () => {
    const endpoint = getEndpoint(key)
    if (!endpoint) {
      setData(initialValueRef.current)
      setLoading(false)
      return
    }

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      // Ensure arrays stay as arrays even if API returns single object
      const processedResult = Array.isArray(initialValueRef.current) && result && !Array.isArray(result)
        ? [result]
        : result
      setData(processedResult)
    } catch (error) {
      console.error('Error loading data:', error)
      // Fallback to localStorage
      const stored = localStorage.getItem(key)
      if (stored) {
        setData(JSON.parse(stored))
      } else {
        setData(initialValueRef.current)
      }
    } finally {
      setLoading(false)
    }
  }, [key])

  // Save data to API
  const saveData = async (value: T) => {
    const endpoint = getEndpoint(key)
    if (!endpoint) {
      localStorage.setItem(key, JSON.stringify(value))
      setData(value)
      return
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(value)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      setData(value)
      // Also save to localStorage as backup
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Error saving data:', error)
      // Fallback to localStorage only
      localStorage.setItem(key, JSON.stringify(value))
      setData(value)
      throw error
    }
  }

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [loadData])

  return [data, saveData, loading]
}

export function useFileUpload() {
  const uploadFile = async (file: File): Promise<string> => {
    const endpoint = `${API_BASE}/photos`

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = async (e) => {
        try {
          const fileData = e.target?.result as string
          
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              fileName: `${Date.now()}-${file.name}`,
              fileData,
              contentType: file.type
            })
          })

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const result = await response.json()
          resolve(result.url)
        } catch (error) {
          console.error('Error uploading file:', error)
          // Fallback to local data URL
          resolve(e.target?.result as string)
        }
      }
      
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })
  }

  return { uploadFile }
}
