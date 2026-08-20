export type BrewerId = 'switch-02' | 'switch-03' | 'clever'
export type RoastLevel = 'light' | 'medium' | 'dark'

export interface Brewer {
  id: BrewerId
  name: string
  shortName: string
  capacityMl: number
  releaseInstruction: string
}

export interface BrewSettings {
  totalWaterMl: number
  ratio: number
  icePercent: number
  brewerId: BrewerId
  roast: RoastLevel
}

export interface BrewResult {
  coffeeGrams: number
  hotWaterMl: number
  iceGrams: number
  totalWaterMl: number
  hotBrewRatio: number
}

export interface CapacityWarning {
  brewer: Brewer
  batches: number
  overflowMl: number
}

export const BREWERS: Brewer[] = [
  {
    id: 'switch-02',
    name: 'Hario Switch 02',
    shortName: 'Switch 02',
    capacityMl: 200,
    releaseInstruction: 'Flip the switch and let the coffee draw down over the ice.',
  },
  {
    id: 'switch-03',
    name: 'Hario Switch 03',
    shortName: 'Switch 03',
    capacityMl: 360,
    releaseInstruction: 'Flip the switch and let the coffee draw down over the ice.',
  },
  {
    id: 'clever',
    name: 'Clever Dripper',
    shortName: 'Clever',
    capacityMl: 500,
    releaseInstruction: 'Place the Clever on the carafe and let it draw down over the ice.',
  },
]

export const DEFAULT_SETTINGS: BrewSettings = {
  totalWaterMl: 500,
  ratio: 1000 / 75,
  icePercent: 34,
  brewerId: 'switch-03',
  roast: 'light',
}

export const SOURCE_BATCHES = [250, 500, 750, 1000]

const roundHalf = (value: number) => Math.round(value * 2) / 2
const roundWhole = (value: number) => Math.round(value)

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function sanitizeSettings(settings: BrewSettings): BrewSettings {
  return {
    totalWaterMl: clamp(Number.isFinite(settings.totalWaterMl) ? settings.totalWaterMl : 500, 150, 1500),
    ratio: clamp(Number.isFinite(settings.ratio) ? settings.ratio : 1000 / 75, 10, 20),
    icePercent: clamp(Number.isFinite(settings.icePercent) ? settings.icePercent : 34, 20, 50),
    brewerId: BREWERS.some((brewer) => brewer.id === settings.brewerId) ? settings.brewerId : 'switch-03',
    roast: ['light', 'medium', 'dark'].includes(settings.roast) ? settings.roast : 'light',
  }
}

export function calculateBrew(input: BrewSettings): BrewResult {
  const settings = sanitizeSettings(input)
  const iceFraction = settings.icePercent / 100

  return {
    coffeeGrams: roundHalf(settings.totalWaterMl / settings.ratio),
    hotWaterMl: roundWhole(settings.totalWaterMl * (1 - iceFraction)),
    iceGrams: roundWhole(settings.totalWaterMl * iceFraction),
    totalWaterMl: roundWhole(settings.totalWaterMl),
    hotBrewRatio: Math.round((settings.totalWaterMl * (1 - iceFraction) / (settings.totalWaterMl / settings.ratio)) * 10) / 10,
  }
}

export function getBrewer(id: BrewerId) {
  return BREWERS.find((brewer) => brewer.id === id) ?? BREWERS[1]
}

export function getCapacityWarning(settings: BrewSettings): CapacityWarning | null {
  const result = calculateBrew(settings)
  const brewer = getBrewer(settings.brewerId)

  if (result.hotWaterMl <= brewer.capacityMl) return null

  return {
    brewer,
    batches: Math.ceil(result.hotWaterMl / brewer.capacityMl),
    overflowMl: result.hotWaterMl - brewer.capacityMl,
  }
}

export function getSteepSeconds(roast: RoastLevel) {
  return roast === 'dark' ? 4 * 60 : 5 * 60
}

export function formatRatio(ratio: number) {
  return ratio.toFixed(1)
}

export function formatCoffee(value: number) {
  return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)
}
