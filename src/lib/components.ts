import { defineComponent, Types } from 'bitecs'

// Position component
export const Position = defineComponent({
  x: Types.f32,
  y: Types.f32
})

// Velocity component
export const Velocity = defineComponent({
  x: Types.f32,
  y: Types.f32
})

// Health component
export const Health = defineComponent({
  current: Types.f32,
  max: Types.f32
})

// Attack component
export const Attack = defineComponent({
  damage: Types.f32,
  range: Types.f32,
  cooldown: Types.f32,
  timer: Types.f32
})

// Defense component
export const Defense = defineComponent({
  value: Types.f32
})

// Monster component
export const Monster = defineComponent({
  type: Types.ui8, // 0: Fire, 1: Water, 2: Earth, 3: Air
  level: Types.ui8
})

// Mergeable component
export const Mergeable = defineComponent({
  canMerge: Types.ui8 // 0: false, 1: true
})

// Collider component
export const Collider = defineComponent({
  radius: Types.f32,
  isTrigger: Types.ui8 // 0: false, 1: true
})

// Overlap component (for collision detection)
export const Overlap = defineComponent({
  entity: Types.eid,
  duration: Types.f32
})

// Sprite component
export const Sprite = defineComponent({
  typeId: Types.ui8,
  animationFrame: Types.ui8,
  scale: Types.f32,
  rotation: Types.f32,
  opacity: Types.f32
})

// Player controlled component (tag)
export const PlayerControlled = defineComponent()

// Enemy component (tag)
export const Enemy = defineComponent()

// AI component
export const AI = defineComponent({
  state: Types.ui8, // 0: idle, 1: chase, 2: attack, 3: flee
  targetEntity: Types.eid,
  detectionRange: Types.f32,
  decisionTimer: Types.f32
})

// Knockback component
export const Knockback = defineComponent({
  force: Types.f32,
  direction: Types.f32,
  remaining: Types.f32
})
