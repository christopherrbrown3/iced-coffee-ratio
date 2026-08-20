export type BrewMethod = 'immersion' | 'flash' | 'aeropress'
export type RecipeId = 'hoffmann' | 'counter-culture-flash' | 'aeropress-japanese' | 'custom'
export type BrewerId = 'switch-02' | 'switch-03' | 'clever' | 'pulsar' | 'v60-02' | 'aeropress-original'
export type RoastLevel = 'light' | 'medium' | 'dark'

export interface RecipePreset {
  id: Exclude<RecipeId, 'custom'>
  name: string
  method: BrewMethod
  totalWaterMl: number
  ratio: number
  icePercent: number
  defaultBrewerId: BrewerId
  sourceLabel: string
  sourceUrl: string
}

export interface Brewer {
  id: BrewerId
  name: string
  shortName: string
  capacityMl: number | null
  methods: BrewMethod[]
  setupInstruction: string
  releaseInstruction: string
}

export interface BrewSettings {
  totalWaterMl: number
  ratio: number
  icePercent: number
  brewerId: BrewerId
  roast: RoastLevel
  recipeId: RecipeId
  method: BrewMethod
}

export interface BrewResult {
  coffeeGrams: number
  hotWaterMl: number
  iceGrams: number
  totalWaterMl: number
  hotBrewRatio: number
}

export interface CapacityWarning {
  brewer: Brewer & { capacityMl: number }
  batches: number
  overflowMl: number
}

export const RECIPES: RecipePreset[] = [
  {
    id: 'hoffmann',
    name: 'Hoffmann · Immersion',
    method: 'immersion',
    totalWaterMl: 500,
    ratio: 1000 / 75,
    icePercent: 34,
    defaultBrewerId: 'switch-03',
    sourceLabel: 'James Hoffmann',
    sourceUrl: 'https://www.youtube.com/watch?v=8uGGeV8A-BM',
  },
  {
    id: 'counter-culture-flash',
    name: 'Counter Culture · Flash',
    method: 'flash',
    totalWaterMl: 500,
    ratio: 500 / 30,
    icePercent: 33,
    defaultBrewerId: 'v60-02',
    sourceLabel: 'Counter Culture',
    sourceUrl: 'https://counterculturecoffee.com/pages/flash-brew',
  },
  {
    id: 'aeropress-japanese',
    name: 'AeroPress · Japanese',
    method: 'aeropress',
    totalWaterMl: 320,
    ratio: 16,
    icePercent: 47,
    defaultBrewerId: 'aeropress-original',
    sourceLabel: 'AeroPress',
    sourceUrl: 'https://aeropress.com/blogs/aeropress-recipes/japanese-coffee',
  },
]

export const BREWERS: Brewer[] = [
  {
    id: 'switch-02',
    name: 'Hario Switch 02',
    shortName: 'Switch 02',
    capacityMl: 200,
    methods: ['immersion'],
    setupInstruction: 'Preheat the Switch, rinse the filter, and leave the switch closed.',
    releaseInstruction: 'Flip the switch and let the coffee draw down over the ice.',
  },
  {
    id: 'switch-03',
    name: 'Hario Switch 03',
    shortName: 'Switch 03',
    capacityMl: 360,
    methods: ['immersion'],
    setupInstruction: 'Preheat the Switch, rinse the filter, and leave the switch closed.',
    releaseInstruction: 'Flip the switch and let the coffee draw down over the ice.',
  },
  {
    id: 'clever',
    name: 'Clever Dripper',
    shortName: 'Clever',
    capacityMl: 500,
    methods: ['immersion'],
    setupInstruction: 'Preheat the Clever and rinse the filter.',
    releaseInstruction: 'Place the Clever on the carafe and let it draw down over the ice.',
  },
  {
    id: 'pulsar',
    name: 'NextLevel Pulsar',
    shortName: 'Pulsar',
    capacityMl: 380,
    methods: ['immersion'],
    setupInstruction: 'Rinse the filter, add coffee, fit the dispersion cap, and close the valve.',
    releaseInstruction: 'Open the Pulsar valve and let the coffee draw down over the ice.',
  },
  {
    id: 'v60-02',
    name: 'Hario V60 02',
    shortName: 'V60 02',
    capacityMl: null,
    methods: ['flash'],
    setupInstruction: 'Rinse the V60 filter, then place the brewer over the ice-filled carafe.',
    releaseInstruction: 'Let the last pour drain, then lift the V60 from the carafe.',
  },
  {
    id: 'aeropress-original',
    name: 'AeroPress Original',
    shortName: 'AeroPress',
    capacityMl: 296,
    methods: ['aeropress'],
    setupInstruction: 'Fit the Flow Control cap with two rinsed paper filters, then add coffee.',
    releaseInstruction: 'Insert the plunger and press gently over the ice.',
  },
]

export const DEFAULT_SETTINGS: BrewSettings = {
  totalWaterMl: 500,
  ratio: 1000 / 75,
  icePercent: 34,
  brewerId: 'switch-03',
  roast: 'light',
  recipeId: 'hoffmann',
  method: 'immersion',
}

export const SOURCE_BATCHES = [250, 500, 750, 1000]

const roundHalf = (value: number) => Math.round(value * 2) / 2
const roundWhole = (value: number) => Math.round(value)

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function getRecipe(id: RecipeId) {
  return id === 'custom' ? null : RECIPES.find((recipe) => recipe.id === id) ?? RECIPES[0]
}

export function getCompatibleBrewers(method: BrewMethod) {
  return BREWERS.filter((brewer) => brewer.methods.includes(method))
}

export function getMethodLabel(method: BrewMethod) {
  if (method === 'flash') return 'flash pour-over'
  if (method === 'aeropress') return 'AeroPress flash'
  return 'iced immersion'
}

export function sanitizeSettings(settings: BrewSettings): BrewSettings {
  const recipeId: RecipeId = RECIPES.some((recipe) => recipe.id === settings.recipeId) || settings.recipeId === 'custom'
    ? settings.recipeId
    : 'hoffmann'
  const recipe = getRecipe(recipeId)
  const method: BrewMethod = recipe?.method ?? (['immersion', 'flash', 'aeropress'].includes(settings.method) ? settings.method : 'immersion')
  const compatibleBrewers = getCompatibleBrewers(method)
  const brewerId = compatibleBrewers.some((brewer) => brewer.id === settings.brewerId)
    ? settings.brewerId
    : recipe?.defaultBrewerId ?? compatibleBrewers[0].id

  return {
    totalWaterMl: clamp(Number.isFinite(settings.totalWaterMl) ? settings.totalWaterMl : 500, 150, 1500),
    ratio: clamp(Number.isFinite(settings.ratio) ? settings.ratio : 1000 / 75, 10, 20),
    icePercent: clamp(Number.isFinite(settings.icePercent) ? settings.icePercent : 34, 20, 50),
    brewerId,
    roast: ['light', 'medium', 'dark'].includes(settings.roast) ? settings.roast : 'light',
    recipeId,
    method,
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

  if (brewer.capacityMl === null || result.hotWaterMl <= brewer.capacityMl) return null

  const capacityBrewer = brewer as Brewer & { capacityMl: number }
  return {
    brewer: capacityBrewer,
    batches: Math.ceil(result.hotWaterMl / capacityBrewer.capacityMl),
    overflowMl: result.hotWaterMl - capacityBrewer.capacityMl,
  }
}

export function getSteepSeconds(roast: RoastLevel) {
  return roast === 'dark' ? 4 * 60 : 5 * 60
}

export function getTimedBrewSeconds(settings: BrewSettings) {
  if (settings.method === 'flash') return 2 * 60
  if (settings.method === 'aeropress') return 90
  return getSteepSeconds(settings.roast)
}

export function formatRatio(ratio: number) {
  return ratio.toFixed(1)
}

export function formatCoffee(value: number) {
  return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)
}
