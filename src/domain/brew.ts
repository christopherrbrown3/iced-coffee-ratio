export type BrewMethod = 'immersion' | 'flash' | 'aeropress'
export type RecipeId = 'hoffmann' | 'counter-culture-flash' | 'april-high-ice' | 'kurasu-japanese' | 'lance-low-ice' | 'aeropress-japanese'
export type RecipeTimerProfileId = 'hoffmann-immersion' | 'counter-culture-flash' | 'april-high-ice' | 'kurasu-japanese-v60' | 'lance-low-ice' | 'aeropress-japanese'
export type BrewerId = 'switch-02' | 'switch-03' | 'clever' | 'pulsar' | 'v60-02' | 'april-brewer' | 'aeropress-original'
export type RoastLevel = 'light' | 'medium' | 'dark'

export interface RecipePreset {
  id: RecipeId
  name: string
  method: BrewMethod
  sourceTotalWaterMl: number
  ratio: number
  icePercent: number
  defaultBrewerId: BrewerId
  supportedBrewerIds: readonly BrewerId[]
  timerProfileId: RecipeTimerProfileId
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

export type StoredBrewSettings = Partial<Omit<BrewSettings, 'recipeId' | 'method'>> & {
  recipeId?: RecipeId | 'custom'
  method?: BrewMethod
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
    name: 'Hoffmann · Iced immersion',
    method: 'immersion',
    sourceTotalWaterMl: 500,
    ratio: 13.3,
    icePercent: 34,
    defaultBrewerId: 'switch-03',
    supportedBrewerIds: ['switch-02', 'switch-03', 'clever', 'pulsar'],
    timerProfileId: 'hoffmann-immersion',
    sourceLabel: 'James Hoffmann',
    sourceUrl: 'https://www.youtube.com/watch?v=8uGGeV8A-BM',
  },
  {
    id: 'counter-culture-flash',
    name: 'Counter Culture · Flash brew',
    method: 'flash',
    sourceTotalWaterMl: 500,
    ratio: 16.7,
    icePercent: 33,
    defaultBrewerId: 'v60-02',
    supportedBrewerIds: ['v60-02', 'april-brewer'],
    timerProfileId: 'counter-culture-flash',
    sourceLabel: 'Counter Culture',
    sourceUrl: 'https://counterculturecoffee.com/pages/flash-brew',
  },
  {
    id: 'april-high-ice',
    name: 'April · High-ice pour-over',
    method: 'flash',
    sourceTotalWaterMl: 400,
    ratio: 20,
    icePercent: 50,
    defaultBrewerId: 'april-brewer',
    supportedBrewerIds: ['april-brewer'],
    timerProfileId: 'april-high-ice',
    sourceLabel: 'April Coffee',
    sourceUrl: 'https://www.youtube.com/watch?v=6B0lRF3kG4s',
  },
  {
    id: 'kurasu-japanese',
    name: 'Kurasu · Japanese V60',
    method: 'flash',
    sourceTotalWaterMl: 220,
    ratio: 13.8,
    icePercent: 32,
    defaultBrewerId: 'v60-02',
    supportedBrewerIds: ['v60-02'],
    timerProfileId: 'kurasu-japanese-v60',
    sourceLabel: 'Kurasu Kyoto',
    sourceUrl: 'https://kurasu.kyoto/blogs/kurasu-journal/brew-guide-on-iced-pour-over-coffee',
  },
  {
    id: 'lance-low-ice',
    name: 'Lance · Low-ice flash',
    method: 'flash',
    sourceTotalWaterMl: 300,
    ratio: 15,
    icePercent: 20,
    defaultBrewerId: 'v60-02',
    supportedBrewerIds: ['v60-02'],
    timerProfileId: 'lance-low-ice',
    sourceLabel: 'Lance Hedrick',
    sourceUrl: 'https://www.youtube.com/watch?v=qwvnQcojq9Q',
  },
  {
    id: 'aeropress-japanese',
    name: 'AeroPress · Japanese flash',
    method: 'aeropress',
    sourceTotalWaterMl: 320,
    ratio: 16,
    icePercent: 47,
    defaultBrewerId: 'aeropress-original',
    supportedBrewerIds: ['aeropress-original'],
    timerProfileId: 'aeropress-japanese',
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
    setupInstruction: 'Rinse the V60 filter, then place the brewer over the carafe.',
    releaseInstruction: 'Let the last pour drain, then lift the V60 from the carafe.',
  },
  {
    id: 'april-brewer',
    name: 'April Brewer',
    shortName: 'April Brewer',
    capacityMl: null,
    methods: ['flash'],
    setupInstruction: 'Rinse the April filter, then place the brewer over the carafe.',
    releaseInstruction: 'Let the final pour drain, then lift the April Brewer from the carafe.',
  },
  {
    id: 'aeropress-original',
    name: 'AeroPress + Flow Control',
    shortName: 'AeroPress',
    capacityMl: 296,
    methods: ['aeropress'],
    setupInstruction: 'Fit the Flow Control cap with two rinsed paper filters.',
    releaseInstruction: 'Insert the plunger and press gently over the ice.',
  },
]

export const DEFAULT_SETTINGS: BrewSettings = {
  totalWaterMl: 500,
  ratio: 13.3,
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

export function quantizeToStep(value: number, step: number) {
  const decimals = Math.max(0, (step.toString().split('.')[1] ?? '').length)
  return Number((Math.round(value / step) * step).toFixed(decimals))
}

export function getRecipe(id: RecipeId) {
  return RECIPES.find((recipe) => recipe.id === id) ?? RECIPES[0]
}

export function getCompatibleBrewers(recipeId: RecipeId) {
  const recipe = getRecipe(recipeId)
  return BREWERS.filter((brewer) => recipe.supportedBrewerIds.includes(brewer.id))
}

function recipeIdForMethod(method: BrewMethod): RecipeId {
  if (method === 'flash') return 'counter-culture-flash'
  if (method === 'aeropress') return 'aeropress-japanese'
  return 'hoffmann'
}

export function isRecipeAdjusted(settings: BrewSettings) {
  const recipe = getRecipe(settings.recipeId)
  return Math.abs(settings.ratio - recipe.ratio) > 0.001 || settings.icePercent !== recipe.icePercent
}

export function sanitizeSettings(settings: StoredBrewSettings): BrewSettings {
  const storedMethod: BrewMethod = settings.method && ['immersion', 'flash', 'aeropress'].includes(settings.method)
    ? settings.method
    : 'immersion'
  const recipeId: RecipeId = RECIPES.some((recipe) => recipe.id === settings.recipeId)
    ? settings.recipeId as RecipeId
    : settings.recipeId === 'custom'
      ? recipeIdForMethod(storedMethod)
      : 'hoffmann'
  const recipe = getRecipe(recipeId)
  const method = recipe.method
  const compatibleBrewers = getCompatibleBrewers(recipe.id)
  const brewerId = compatibleBrewers.some((brewer) => brewer.id === settings.brewerId)
    ? settings.brewerId as BrewerId
    : recipe.defaultBrewerId

  return {
    totalWaterMl: roundWhole(clamp(Number.isFinite(settings.totalWaterMl) ? settings.totalWaterMl as number : DEFAULT_SETTINGS.totalWaterMl, 150, 1500)),
    ratio: quantizeToStep(clamp(Number.isFinite(settings.ratio) ? settings.ratio as number : DEFAULT_SETTINGS.ratio, 10, 20), 0.1),
    icePercent: roundWhole(clamp(Number.isFinite(settings.icePercent) ? settings.icePercent as number : DEFAULT_SETTINGS.icePercent, 20, 50)),
    brewerId,
    roast: settings.roast && ['light', 'medium', 'dark'].includes(settings.roast) ? settings.roast : 'light',
    recipeId,
    method,
  }
}

export function calculateBrew(input: BrewSettings): BrewResult {
  const settings = sanitizeSettings(input)
  const iceFraction = settings.icePercent / 100
  const totalWaterMl = roundWhole(settings.totalWaterMl)
  const iceGrams = roundWhole(totalWaterMl * iceFraction)
  const hotWaterMl = totalWaterMl - iceGrams

  return {
    coffeeGrams: roundHalf(totalWaterMl / settings.ratio),
    hotWaterMl,
    iceGrams,
    totalWaterMl,
    hotBrewRatio: Math.round((hotWaterMl / (totalWaterMl / settings.ratio)) * 10) / 10,
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

export function formatRatio(ratio: number) {
  return ratio.toFixed(1)
}

export function formatCoffee(value: number) {
  return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)
}
