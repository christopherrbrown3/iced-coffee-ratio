import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SETTINGS,
  RECIPES,
  calculateBrew,
  type BrewResult,
  type BrewSettings,
  type RecipeTimerProfileId,
} from './brew'
import {
  TIMER_PROFILES,
  resolveTimerGuide,
  resolveTimerGuideForProfile,
  validateTimerProfiles,
  type RecipeTimerProfile,
} from './timerGuide'

function settings(overrides: Partial<BrewSettings> = {}): BrewSettings {
  return { ...DEFAULT_SETTINGS, ...overrides }
}

function result(coffeeGrams: number, hotWaterMl: number, iceGrams: number): BrewResult {
  return {
    coffeeGrams,
    hotWaterMl,
    iceGrams,
    totalWaterMl: hotWaterMl + iceGrams,
    hotBrewRatio: Math.round(hotWaterMl / coffeeGrams * 10) / 10,
  }
}

const resolve = (
  profileId: RecipeTimerProfileId,
  brewSettings: BrewSettings,
  brewResult: BrewResult,
) => resolveTimerGuideForProfile(profileId, brewSettings, brewResult)

describe('timer guide profiles', () => {
  it('satisfies all static timer invariants', () => {
    expect(validateTimerProfiles()).toEqual([])
  })

  it('rejects unsafe cue ordering and target fractions', () => {
    const april = TIMER_PROFILES['april-high-ice']
    const invalid: RecipeTimerProfile = {
      ...april,
      steps: [
        { ...april.steps[0], at: { kind: 'elapsed', seconds: 10 } },
        {
          ...april.steps[1],
          at: { kind: 'elapsed', seconds: 10 },
          target: { kind: 'hot-water-fraction', fraction: 1.1 },
        },
      ],
    }

    expect(validateTimerProfiles({ invalid })).toEqual(expect.arrayContaining([
      'invalid: light first cue must be at 0 seconds',
      'invalid: light cues must be strictly increasing',
      'invalid: step 2 fraction must be greater than 0 and at most 1',
    ]))
  })

  it('rejects empty authored copy', () => {
    const april = TIMER_PROFILES['april-high-ice']
    const invalid: RecipeTimerProfile = {
      ...april,
      ready: [{ kind: 'text', text: ' ' }],
      steps: [{ ...april.steps[0], copy: { ...april.steps[0].copy, title: '' } }, april.steps[1]],
      release: { ...april.release, buttonLabel: '' },
    }

    expect(validateTimerProfiles({ invalid })).toEqual(expect.arrayContaining([
      'invalid: ready instruction 1 must not be empty',
      'invalid: step 1 copy must not be empty',
      'invalid: release copy must not be empty',
    ]))
  })
})

describe('resolved timer guides', () => {
  it('preserves Hoffmann roast timing and resolves the ice cue 30 seconds before release', () => {
    const lightSettings = settings()
    const brewResult = calculateBrew(lightSettings)
    const light = resolve('hoffmann-immersion', lightSettings, brewResult)
    const dark = resolve('hoffmann-immersion', { ...lightSettings, roast: 'dark' }, brewResult)

    expect(light.durationSeconds).toBe(300)
    expect(light.steps.map((step) => step.atSeconds)).toEqual([0, 270])
    expect(light.steps[1]).toMatchObject({ targetAmount: 170, targetUnit: 'g', tone: 'ice' })
    expect(dark.durationSeconds).toBe(240)
    expect(dark.steps.map((step) => step.atSeconds)).toEqual([0, 210])
  })

  it('reproduces the Counter Culture source targets and cadence', () => {
    const brewSettings = settings({
      recipeId: 'counter-culture-flash',
      method: 'flash',
      brewerId: 'v60-02',
      ratio: 16.7,
      icePercent: 33,
    })
    const guide = resolve('counter-culture-flash', brewSettings, calculateBrew(brewSettings))

    expect(guide.durationSeconds).toBe(120)
    expect(guide.steps.map((step) => step.atSeconds)).toEqual([0, 30, 60, 90])
    expect(guide.steps.map((step) => step.targetAmount)).toEqual([30, 100, 200, 335])
    expect(guide.readyInstructions.join(' ')).toContain('93 °C')
    expect(guide.complete.instruction).toBe('Pour over fresh ice and enjoy.')
  })

  it('preserves the AeroPress 90-second steep and full-water target', () => {
    const brewSettings = settings({
      recipeId: 'aeropress-japanese',
      method: 'aeropress',
      brewerId: 'aeropress-original',
      totalWaterMl: 320,
      ratio: 16,
      icePercent: 47,
    })
    const guide = resolve('aeropress-japanese', brewSettings, calculateBrew(brewSettings))

    expect(guide.durationSeconds).toBe(90)
    expect(guide.steps).toHaveLength(1)
    expect(guide.steps[0]).toMatchObject({ atSeconds: 0, targetAmount: 170, targetUnit: 'mL' })
    expect(guide.release.buttonLabel).toBe('DONE PRESSING')
    expect(guide.complete.instruction).not.toMatch(/melt|fresh ice/i)
  })

  it('resolves Kurasu, April, and Lance source-batch targets and timer checkpoints', () => {
    const flashSettings = settings({ method: 'flash', brewerId: 'v60-02' })
    const kurasu = resolve('kurasu-japanese-v60', flashSettings, result(16, 150, 70))
    const april = resolve('april-high-ice', flashSettings, result(20, 200, 200))
    const lance = resolve('lance-low-ice', flashSettings, result(20, 240, 60))

    expect(kurasu.durationSeconds).toBe(130)
    expect(kurasu.steps.map((step) => [step.atSeconds, step.targetAmount])).toEqual([
      [0, 40], [40, 100], [70, 150],
    ])
    expect(april.durationSeconds).toBe(120)
    expect(april.steps.map((step) => [step.atSeconds, step.targetAmount])).toEqual([
      [0, 100], [30, 200],
    ])
    expect(lance.durationSeconds).toBe(105)
    expect(lance.steps.map((step) => [step.atSeconds, step.targetAmount])).toEqual([
      [0, 60], [60, 150],
    ])
    expect(kurasu.readyInstructions.join(' ')).toContain('91 °C')
    expect(kurasu.readyInstructions.join(' ')).toContain('ground coarse')
    expect(kurasu.steps[0].instruction).toContain('three firm back-and-forth spoon strokes')
    expect(kurasu.steps[2].instruction).toContain('one full circle around the bed')
    expect(kurasu.complete.instruction).toContain('all of the brew ice has melted')
    expect(april.readyInstructions.join(' ')).toContain('92 °C')
    expect(april.steps[0].instruction).toContain('in circles')
    expect(april.steps[1].instruction).toContain('through the center')
    expect(april.complete.title).toBe('Ready to serve')
    expect(april.complete.instruction).not.toMatch(/stir|melt/i)
  })

  it('scales cumulative pour targets from current hot water rather than source batch size', () => {
    const flashSettings = settings({ method: 'flash', brewerId: 'v60-02' })

    expect(resolve('kurasu-japanese-v60', flashSettings, result(32, 300, 140)).steps.map((step) => step.targetAmount))
      .toEqual([80, 200, 300])
    expect(resolve('april-high-ice', flashSettings, result(40, 400, 400)).steps.map((step) => step.targetAmount))
      .toEqual([200, 400])
    const lance = resolve('lance-low-ice', flashSettings, result(40, 480, 120))
    expect(lance.steps.map((step) => step.targetAmount)).toEqual([120, 300])
    expect(lance.release.instruction).toContain('to 480 mL')
  })

  it('scales a coffee-based bloom when ratio changes while water targets follow hot water', () => {
    const flashSettings = settings({ method: 'flash', brewerId: 'v60-02' })
    const guide = resolve('counter-culture-flash', flashSettings, result(22.5, 333, 167))

    expect(guide.steps.map((step) => step.targetAmount)).toEqual([23, 99, 199, 333])
  })

  it('keeps Lance beverage ice out of setup and adds it directly during release', () => {
    const brewSettings = settings({ method: 'flash', brewerId: 'v60-02' })
    const guide = resolve('lance-low-ice', brewSettings, result(20, 240, 60))

    expect(guide.readyInstructions.join(' ')).toContain('Keep 60 g ice in the freezer')
    expect(guide.readyInstructions.join(' ')).toContain('empty server')
    expect(guide.readyInstructions.join(' ')).not.toContain('ice-filled carafe')
    expect(guide.readyInstructions.join(' ')).not.toContain('ice bath')
    expect(guide.release.instruction).toContain('to 240 mL')
    expect(guide.release.instruction).toContain('add 60 g ice')
    expect(guide.release.instruction).toContain('directly to the brew')
    expect(guide.release.buttonLabel).toBe('DONE CHILLING')
    expect(guide.steps[0].instruction).toContain('wait until 1:00')
    expect(guide.release.instruction).toContain('one small swirl')
    expect(guide.complete.instruction).toContain('chilled coffee')
  })

  it('resolves every recipe through its assigned production profile', () => {
    for (const recipe of RECIPES) {
      const brewSettings: BrewSettings = {
        ...DEFAULT_SETTINGS,
        totalWaterMl: recipe.sourceTotalWaterMl,
        ratio: recipe.ratio,
        icePercent: recipe.icePercent,
        brewerId: recipe.defaultBrewerId,
        recipeId: recipe.id,
        method: recipe.method,
      }
      const brewResult = calculateBrew(brewSettings)

      expect(resolveTimerGuide(brewSettings, brewResult)).toEqual(
        resolveTimerGuideForProfile(recipe.timerProfileId, brewSettings, brewResult),
      )
    }
  })
})
