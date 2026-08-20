import { useEffect, useState } from 'react'
import { DEFAULT_SETTINGS, sanitizeSettings, type BrewSettings } from '../domain/brew'

const STORAGE_KEY = 'iced-coffee-calculator:settings:v2'
const LEGACY_STORAGE_KEY = 'ratio-hero:settings:v1'

function migrateLegacySettings(saved: Partial<BrewSettings>) {
  const matchesHoffmann = Math.abs((saved.ratio ?? DEFAULT_SETTINGS.ratio) - DEFAULT_SETTINGS.ratio) < 0.05
    && (saved.icePercent ?? DEFAULT_SETTINGS.icePercent) === DEFAULT_SETTINGS.icePercent

  return {
    ...DEFAULT_SETTINGS,
    ...saved,
    recipeId: matchesHoffmann ? 'hoffmann' : 'custom',
    method: 'immersion',
  } as BrewSettings
}

function readSettings() {
  try {
    const current = window.localStorage.getItem(STORAGE_KEY)
    if (current) return sanitizeSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(current) })

    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY)
    return legacy ? sanitizeSettings(migrateLegacySettings(JSON.parse(legacy))) : DEFAULT_SETTINGS
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
