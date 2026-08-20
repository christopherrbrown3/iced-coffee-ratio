import { useEffect, useState } from 'react'
import { DEFAULT_SETTINGS, sanitizeSettings, type BrewSettings } from '../domain/brew'

const STORAGE_KEY = 'ratio-hero:settings:v1'

function readSettings() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    return saved ? sanitizeSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) }) : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function usePersistentSettings() {
  const [settings, setSettings] = useState<BrewSettings>(readSettings)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  return [settings, setSettings] as const
}
