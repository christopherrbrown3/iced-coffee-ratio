import { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_SETTINGS, sanitizeSettings, type BrewSettings, type StoredBrewSettings } from '../domain/brew'

const STORAGE_KEY = 'iced-coffee-calculator:settings:v3'
const PREVIOUS_STORAGE_KEY = 'iced-coffee-calculator:settings:v2'
const LEGACY_STORAGE_KEY = 'ratio-hero:settings:v1'

function migrateLegacySettings(saved: StoredBrewSettings): StoredBrewSettings {
  const matchesHoffmann = Math.abs((saved.ratio ?? DEFAULT_SETTINGS.ratio) - DEFAULT_SETTINGS.ratio) < 0.05
    && (saved.icePercent ?? DEFAULT_SETTINGS.icePercent) === DEFAULT_SETTINGS.icePercent

  return {
    ...DEFAULT_SETTINGS,
    ...saved,
    recipeId: matchesHoffmann ? 'hoffmann' : 'custom',
    method: 'immersion',
  }
}

function readSettings() {
  try {
    const current = window.localStorage.getItem(STORAGE_KEY)
    if (current) return sanitizeSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(current) })

    const previous = window.localStorage.getItem(PREVIOUS_STORAGE_KEY)
    if (previous) return sanitizeSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(previous) })

    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY)
    return legacy ? sanitizeSettings(migrateLegacySettings(JSON.parse(legacy))) : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function usePersistentSettings() {
  const [settings, setSettings] = useState<BrewSettings>(readSettings)
  const latestSettings = useRef(settings)
  latestSettings.current = settings

  const persist = useCallback((next: BrewSettings) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // The calculator remains fully usable when storage is blocked or full.
    }
  }, [])

  useEffect(() => {
    const timeout = window.setTimeout(() => persist(settings), 120)
    return () => window.clearTimeout(timeout)
  }, [persist, settings])

  useEffect(() => {
    const flush = () => persist(latestSettings.current)
    window.addEventListener('pagehide', flush)
    return () => {
      window.removeEventListener('pagehide', flush)
      flush()
    }
  }, [persist])

  return [settings, setSettings] as const
}
