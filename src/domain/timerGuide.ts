import {
  formatCoffee,
  getBrewer,
  getRecipe,
  type BrewResult,
  type BrewSettings,
  type RecipeTimerProfileId,
  type RoastLevel,
} from './brew'

type TimerTone = 'timed' | 'ice'
type QuantityUnit = 'mL' | 'g'

type DurationDefinition =
  | { kind: 'fixed'; seconds: number }
  | { kind: 'by-roast'; seconds: Record<RoastLevel, number> }

type CueDefinition =
  | { kind: 'elapsed'; seconds: number }
  | { kind: 'before-end'; seconds: number }

type TargetDefinition =
  | { kind: 'hot-water-fraction'; fraction: number }
  | { kind: 'coffee-multiple'; multiplier: number }
  | { kind: 'ice-fraction'; fraction: number }

type ReadyInstructionDefinition =
  | { kind: 'brewer-setup' }
  | { kind: 'add-ice'; destination: 'carafe' | 'tumbler' }
  | { kind: 'hold-ice'; until: 'cue' | 'release' }
  | { kind: 'add-coffee'; grind: string }
  | { kind: 'immersion-load' }
  | { kind: 'mix' }
  | { kind: 'aeropress-temperature' }
  | { kind: 'aeropress-load'; grind: string }
  | { kind: 'text'; text: string }

interface StepCopy {
  eyebrow: string
  title: string
  beforeAmount: string
  afterAmount: string
}

type TimerStepDefinition =
  | {
      kind: 'quantity'
      at: CueDefinition
      target: TargetDefinition
      tone?: TimerTone
      copy: StepCopy
    }
  | {
      kind: 'instruction'
      at: CueDefinition
      tone?: TimerTone
      eyebrow: string
      title: string
      instruction: string
    }

interface ReleaseDefinition {
  eyebrow: string
  title: string
  buttonLabel: string
  instruction: 'brewer-release' | 'lance-chill'
}

export interface RecipeTimerProfile {
  duration: DurationDefinition
  ready: readonly ReadyInstructionDefinition[]
  steps: readonly TimerStepDefinition[]
  release: ReleaseDefinition
  complete: 'melt-and-serve' | 'melt-all-and-serve' | 'serve' | 'serve-over-ice' | 'serve-chilled'
}

export interface ResolvedTimerStep {
  atSeconds: number
  eyebrow: string
  title: string
  instruction: string
  tone: TimerTone
  targetAmount?: number
  targetUnit?: QuantityUnit
}

export interface ResolvedTimerRelease {
  eyebrow: string
  title: string
  instruction: string
  buttonLabel: string
}

export interface ResolvedTimerGuide {
  durationSeconds: number
  readyInstructions: string[]
  steps: ResolvedTimerStep[]
  release: ResolvedTimerRelease
  complete: {
    eyebrow: string
    title: string
    instruction: string
  }
}

const fixed = (seconds: number): DurationDefinition => ({ kind: 'fixed', seconds })
const elapsed = (seconds: number): CueDefinition => ({ kind: 'elapsed', seconds })
const beforeEnd = (seconds: number): CueDefinition => ({ kind: 'before-end', seconds })
const hotWaterFraction = (fraction: number): TargetDefinition => ({ kind: 'hot-water-fraction', fraction })

const meltAndServe = 'Stir until most of the brew ice has melted, then serve over fresh ice.'
export const TIMER_PROFILES = {
  'hoffmann-immersion': {
    duration: { kind: 'by-roast', seconds: { light: 300, medium: 300, dark: 240 } },
    ready: [
      { kind: 'brewer-setup' },
      { kind: 'immersion-load' },
      { kind: 'mix' },
      { kind: 'hold-ice', until: 'cue' },
    ],
    steps: [
      {
        kind: 'instruction',
        at: elapsed(0),
        eyebrow: 'Steep',
        title: 'Mix, then let it mingle',
        instruction: 'Let the coffee steep. Give it one gentle stir if any grounds remain dry.',
      },
      {
        kind: 'quantity',
        at: beforeEnd(30),
        target: { kind: 'ice-fraction', fraction: 1 },
        tone: 'ice',
        copy: {
          eyebrow: 'Almost!',
          title: 'Ice in the carafe',
          beforeAmount: 'Weigh ',
          afterAmount: ' straight from the freezer into your carafe.',
        },
      },
    ],
    release: {
      eyebrow: 'Release',
      title: 'Let it rain',
      buttonLabel: 'DONE DRAINING',
      instruction: 'brewer-release',
    },
    complete: 'melt-and-serve',
  },
  'counter-culture-flash': {
    duration: fixed(120),
    ready: [
      { kind: 'add-ice', destination: 'carafe' },
      { kind: 'brewer-setup' },
      { kind: 'text', text: 'Heat the brew water to about 93 °C.' },
      { kind: 'add-coffee', grind: 'medium-fine' },
    ],
    steps: [
      {
        kind: 'quantity',
        at: elapsed(0),
        target: { kind: 'coffee-multiple', multiplier: 1 },
        copy: {
          eyebrow: 'Bloom',
          title: 'Wake up the coffee',
          beforeAmount: 'Start the timer and bloom with ',
          afterAmount: ', wetting every ground.',
        },
      },
      {
        kind: 'quantity',
        at: elapsed(30),
        target: hotWaterFraction(100 / 335),
        copy: {
          eyebrow: 'Pour',
          title: 'Circle to the first mark',
          beforeAmount: 'Pour in gentle circles until the scale reaches ',
          afterAmount: '.',
        },
      },
      {
        kind: 'quantity',
        at: elapsed(60),
        target: hotWaterFraction(200 / 335),
        copy: {
          eyebrow: 'Pour',
          title: 'Build the brew',
          beforeAmount: 'When the bed drops about 1 cm, pour in circles to ',
          afterAmount: '.',
        },
      },
      {
        kind: 'quantity',
        at: elapsed(90),
        target: hotWaterFraction(1),
        copy: {
          eyebrow: 'Pulse',
          title: 'Finish the pour',
          beforeAmount: 'Keep pulsing every 30 seconds as it drains, stopping at ',
          afterAmount: ' total hot water.',
        },
      },
    ],
    release: {
      eyebrow: 'Drain',
      title: 'Check the drawdown',
      buttonLabel: 'DONE DRAINING',
      instruction: 'brewer-release',
    },
    complete: 'serve-over-ice',
  },
  'aeropress-japanese': {
    duration: fixed(90),
    ready: [
      { kind: 'add-ice', destination: 'tumbler' },
      { kind: 'brewer-setup' },
      { kind: 'aeropress-temperature' },
      { kind: 'aeropress-load', grind: 'medium-fine' },
    ],
    steps: [
      {
        kind: 'quantity',
        at: elapsed(0),
        target: hotWaterFraction(1),
        copy: {
          eyebrow: 'Steep',
          title: 'Pour, stir, wait',
          beforeAmount: 'Add ',
          afterAmount: ' hot water, stir until every ground is wet, and steep for 1:30.',
        },
      },
    ],
    release: {
      eyebrow: 'Press',
      title: 'Press it gently',
      buttonLabel: 'DONE PRESSING',
      instruction: 'brewer-release',
    },
    complete: 'serve',
  },
  'kurasu-japanese-v60': {
    duration: fixed(130),
    ready: [
      { kind: 'add-ice', destination: 'carafe' },
      { kind: 'brewer-setup' },
      { kind: 'text', text: 'Heat the brew water to 91 °C.' },
      { kind: 'add-coffee', grind: 'coarse' },
    ],
    steps: [
      {
        kind: 'quantity',
        at: elapsed(0),
        target: hotWaterFraction(40 / 150),
        copy: {
          eyebrow: 'First pour',
          title: 'Wet the whole bed',
          beforeAmount: 'Pour steadily until the scale reaches ',
          afterAmount: ' over about 10 seconds, then reach into the cone with three firm back-and-forth spoon strokes.',
        },
      },
      {
        kind: 'quantity',
        at: elapsed(40),
        target: hotWaterFraction(100 / 150),
        copy: {
          eyebrow: 'Second pour',
          title: 'Build the brew',
          beforeAmount: 'Pour energetically to wet the whole bed, stopping at ',
          afterAmount: ' on the scale over about 10 seconds.',
        },
      },
      {
        kind: 'quantity',
        at: elapsed(70),
        target: hotWaterFraction(1),
        copy: {
          eyebrow: 'Final pour',
          title: 'Bring it home',
          beforeAmount: 'Pour gently to finish at ',
          afterAmount: ' total hot water over about 10 seconds, then stir one full circle around the bed. Aim to finish around 2:10.',
        },
      },
    ],
    release: {
      eyebrow: 'Drain',
      title: 'Let the last pour drain',
      buttonLabel: 'DONE DRAINING',
      instruction: 'brewer-release',
    },
    complete: 'melt-all-and-serve',
  },
  'april-high-ice': {
    duration: fixed(120),
    ready: [
      { kind: 'add-ice', destination: 'carafe' },
      { kind: 'brewer-setup' },
      { kind: 'text', text: 'Heat the brew water to 92 °C.' },
      { kind: 'add-coffee', grind: 'medium-coarse (about 30 clicks on a Comandante)' },
    ],
    steps: [
      {
        kind: 'quantity',
        at: elapsed(0),
        target: hotWaterFraction(0.5),
        copy: {
          eyebrow: 'First pour',
          title: 'Circle to the first mark',
          beforeAmount: 'Pour quickly in circles until the scale reaches ',
          afterAmount: '.',
        },
      },
      {
        kind: 'quantity',
        at: elapsed(30),
        target: hotWaterFraction(1),
        copy: {
          eyebrow: 'Second pour',
          title: 'Finish through the center',
          beforeAmount: 'Pour quickly through the center until the scale reaches ',
          afterAmount: ' total hot water. Aim to finish around 2:00.',
        },
      },
    ],
    release: {
      eyebrow: 'Drain',
      title: 'Let the last pour drain',
      buttonLabel: 'DONE DRAINING',
      instruction: 'brewer-release',
    },
    complete: 'serve',
  },
  'lance-low-ice': {
    duration: fixed(105),
    ready: [
      { kind: 'hold-ice', until: 'release' },
      { kind: 'text', text: 'Rinse the V60 filter and set the brewer over an empty server.' },
      { kind: 'add-coffee', grind: 'a little coarser than for a high-ice flash brew' },
    ],
    steps: [
      {
        kind: 'quantity',
        at: elapsed(0),
        target: hotWaterFraction(0.25),
        copy: {
          eyebrow: 'First pour',
          title: 'Saturate the bed',
          beforeAmount: 'Bloom evenly to ',
          afterAmount: ', then wait until 1:00.',
        },
      },
      {
        kind: 'quantity',
        at: elapsed(60),
        target: hotWaterFraction(0.625),
        copy: {
          eyebrow: 'Second pour',
          title: 'Keep extraction moving',
          beforeAmount: 'Pour steadily until the scale reaches ',
          afterAmount: ', then wait until 1:45.',
        },
      },
    ],
    release: {
      eyebrow: 'Final pour',
      title: 'Pour, drain, chill',
      buttonLabel: 'DONE CHILLING',
      instruction: 'lance-chill',
    },
    complete: 'serve-chilled',
  },
} as const satisfies Record<RecipeTimerProfileId, RecipeTimerProfile>

function resolveDuration(duration: DurationDefinition, roast: RoastLevel) {
  return duration.kind === 'fixed' ? duration.seconds : duration.seconds[roast]
}

function resolveCue(at: CueDefinition, durationSeconds: number) {
  return at.kind === 'elapsed' ? at.seconds : durationSeconds - at.seconds
}

function resolveTarget(target: TargetDefinition, result: BrewResult): { amount: number; unit: QuantityUnit } {
  if (target.kind === 'coffee-multiple') {
    return {
      amount: Math.min(result.hotWaterMl, Math.max(1, Math.round(result.coffeeGrams * target.multiplier))),
      unit: 'mL',
    }
  }

  if (target.kind === 'ice-fraction') {
    return {
      amount: target.fraction === 1 ? result.iceGrams : Math.round(result.iceGrams * target.fraction),
      unit: 'g',
    }
  }

  return {
    amount: target.fraction === 1 ? result.hotWaterMl : Math.round(result.hotWaterMl * target.fraction),
    unit: 'mL',
  }
}

function renderReadyInstruction(definition: ReadyInstructionDefinition, settings: BrewSettings, result: BrewResult) {
  const brewer = getBrewer(settings.brewerId)
  const coffee = formatCoffee(result.coffeeGrams)

  if (definition.kind === 'brewer-setup') return brewer.setupInstruction
  if (definition.kind === 'add-ice') {
    const destination = definition.destination === 'tumbler' ? 'a sturdy tumbler' : 'the carafe'
    return `Add ${result.iceGrams} g ice to ${destination}.`
  }
  if (definition.kind === 'hold-ice') {
    return definition.until === 'release'
      ? `Keep ${result.iceGrams} g ice in the freezer until the chilling step.`
      : `Keep ${result.iceGrams} g ice in the freezer until the cue.`
  }
  if (definition.kind === 'add-coffee') return `Add ${coffee} g coffee, ground ${definition.grind}.`
  if (definition.kind === 'immersion-load') {
    return settings.brewerId === 'pulsar'
      ? `Pour ${result.hotWaterMl} mL through the cap and agitate gently.`
      : `Add ${result.hotWaterMl} mL hot water, then ${coffee} g coffee.`
  }
  if (definition.kind === 'mix') return 'Mix thoroughly—no dry pockets.'
  if (definition.kind === 'aeropress-temperature') {
    const position = settings.roast === 'dark' ? 'cooler' : settings.roast === 'light' ? 'hotter' : 'middle'
    return `Use the ${position} end of the 88–96 °C range.`
  }
  if (definition.kind === 'aeropress-load') {
    return `Set the AeroPress on the tumbler and add ${coffee} g ${definition.grind} coffee.`
  }
  return definition.text
}

function resolveRelease(definition: ReleaseDefinition, settings: BrewSettings, result: BrewResult): ResolvedTimerRelease {
  const brewer = getBrewer(settings.brewerId)
  const instruction = definition.instruction === 'brewer-release'
    ? brewer.releaseInstruction
    : `At 1:45, pour slowly to ${result.hotWaterMl} mL while minimizing agitation, then give the brewer one small swirl. Once it drains, add ${result.iceGrams} g ice directly to the brew and stir until cool to the touch.`

  return {
    eyebrow: definition.eyebrow,
    title: definition.title,
    instruction,
    buttonLabel: definition.buttonLabel,
  }
}

export function resolveTimerGuideForProfile(
  profileId: RecipeTimerProfileId,
  settings: BrewSettings,
  result: BrewResult,
): ResolvedTimerGuide {
  const profile: RecipeTimerProfile = TIMER_PROFILES[profileId]
  const durationSeconds = resolveDuration(profile.duration, settings.roast)
  const steps = profile.steps.map<ResolvedTimerStep>((step) => {
    const atSeconds = resolveCue(step.at, durationSeconds)
    if (step.kind === 'instruction') {
      return {
        atSeconds,
        eyebrow: step.eyebrow,
        title: step.title,
        instruction: step.instruction,
        tone: step.tone ?? 'timed',
      }
    }

    const target = resolveTarget(step.target, result)
    return {
      atSeconds,
      eyebrow: step.copy.eyebrow,
      title: step.copy.title,
      instruction: `${step.copy.beforeAmount}${target.amount} ${target.unit}${step.copy.afterAmount}`,
      tone: step.tone ?? 'timed',
      targetAmount: target.amount,
      targetUnit: target.unit,
    }
  })

  return {
    durationSeconds,
    readyInstructions: profile.ready.map((instruction) => renderReadyInstruction(instruction, settings, result)),
    steps,
    release: resolveRelease(profile.release, settings, result),
    complete: profile.complete === 'melt-and-serve'
      ? { eyebrow: 'Ta-da!', title: 'Stir, pour, enjoy', instruction: meltAndServe }
      : profile.complete === 'melt-all-and-serve'
        ? { eyebrow: 'Ta-da!', title: 'Ready to pour', instruction: 'Once all of the brew ice has melted, pour over fresh ice and enjoy.' }
        : profile.complete === 'serve'
          ? { eyebrow: 'Ta-da!', title: 'Ready to serve', instruction: 'Serve the chilled coffee and enjoy.' }
          : profile.complete === 'serve-over-ice'
            ? { eyebrow: 'Ta-da!', title: 'Pour it over ice', instruction: 'Pour over fresh ice and enjoy.' }
            : { eyebrow: 'Ta-da!', title: 'Pour it over ice', instruction: 'Pour the chilled coffee over fresh ice and enjoy.' },
  }
}

export function resolveTimerGuide(settings: BrewSettings, result: BrewResult) {
  const recipe = getRecipe(settings.recipeId)
  return resolveTimerGuideForProfile(recipe.timerProfileId, settings, result)
}

export function validateTimerProfiles(profiles: Readonly<Record<string, RecipeTimerProfile>> = TIMER_PROFILES) {
  const errors: string[] = []
  const roasts: RoastLevel[] = ['light', 'medium', 'dark']

  for (const [profileId, profile] of Object.entries(profiles)) {
    if (profile.ready.length === 0) errors.push(`${profileId}: ready instructions must not be empty`)
    if (profile.steps.length === 0) errors.push(`${profileId}: timed steps must not be empty`)
    if (!profile.release.eyebrow.trim() || !profile.release.title.trim() || !profile.release.buttonLabel.trim()) {
      errors.push(`${profileId}: release copy must not be empty`)
    }
    profile.ready.forEach((instruction, index) => {
      if (instruction.kind === 'text' && !instruction.text.trim()) {
        errors.push(`${profileId}: ready instruction ${index + 1} must not be empty`)
      }
      if ((instruction.kind === 'add-coffee' || instruction.kind === 'aeropress-load') && !instruction.grind.trim()) {
        errors.push(`${profileId}: ready instruction ${index + 1} grind must not be empty`)
      }
    })

    for (const roast of roasts) {
      const durationSeconds = resolveDuration(profile.duration, roast)
      if (!Number.isInteger(durationSeconds) || durationSeconds <= 0) {
        errors.push(`${profileId}: ${roast} duration must be a positive whole second`)
        continue
      }

      const cueSeconds = profile.steps.map((step) => resolveCue(step.at, durationSeconds))
      if (cueSeconds[0] !== 0) errors.push(`${profileId}: ${roast} first cue must be at 0 seconds`)
      cueSeconds.forEach((cue, index) => {
        if (!Number.isInteger(cue) || cue < 0 || cue >= durationSeconds) {
          errors.push(`${profileId}: ${roast} cue ${index + 1} must be a whole second within the timed phase`)
        }
        if (index > 0 && cue <= cueSeconds[index - 1]) {
          errors.push(`${profileId}: ${roast} cues must be strictly increasing`)
        }
      })
    }

    profile.steps.forEach((step, index) => {
      const copyIsEmpty = step.kind === 'instruction'
        ? !step.eyebrow.trim() || !step.title.trim() || !step.instruction.trim()
        : !step.copy.eyebrow.trim() || !step.copy.title.trim() || !step.copy.beforeAmount.trim()
      if (copyIsEmpty) errors.push(`${profileId}: step ${index + 1} copy must not be empty`)
      if (step.kind !== 'quantity') return
      const target = step.target
      if (target.kind === 'coffee-multiple') {
        if (!Number.isFinite(target.multiplier) || target.multiplier <= 0) {
          errors.push(`${profileId}: step ${index + 1} coffee multiplier must be positive`)
        }
      } else if (!Number.isFinite(target.fraction) || target.fraction <= 0 || target.fraction > 1) {
        errors.push(`${profileId}: step ${index + 1} fraction must be greater than 0 and at most 1`)
      }
    })
  }

  return errors
}
