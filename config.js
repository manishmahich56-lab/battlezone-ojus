// ══════════════════════════════════════════
// js/config.js  —  Global game configuration
// All tunable constants live here.
// ══════════════════════════════════════════

const CONFIG = {

  // ── MAP ──────────────────────────────────
  MAP_SIZE:         200,    // half-extent of the ground (ground = 400×400 units)
  WALL_HEIGHT:      2,      // height of boundary walls (invisible barrier logic)

  // ── PLAYER ───────────────────────────────
  PLAYER_SPEED:     12,     // units/second normal walk
  PLAYER_SPRINT:    20,     // units/second sprint
  PLAYER_JUMP:      8,      // vertical impulse
  PLAYER_HEIGHT:    1.8,    // camera height above ground
  PLAYER_MAX_HP:    100,
  PLAYER_RADIUS:    0.5,    // collision radius

  // ── CAMERA ───────────────────────────────
  MOUSE_SENSITIVITY: 0.002,
  FOV:              75,

  // ── GUN ──────────────────────────────────
  MAG_SIZE:         30,
  RESERVE_AMMO:     90,
  RELOAD_TIME:      2000,   // ms
  FIRE_RATE:        120,    // ms between shots (500 rpm)
  BULLET_SPEED:     80,
  BULLET_LIFETIME:  1.2,    // seconds
  BULLET_DAMAGE:    25,
  BULLET_SPREAD:    0.025,  // random angle offset

  // ── ENEMIES ──────────────────────────────
  ENEMY_COUNT:      9,      // bots (player = 10th)
  ENEMY_MAX_HP:     60,
  ENEMY_SPEED:      4,
  ENEMY_SHOOT_RANGE:25,
  ENEMY_SPOT_RANGE: 40,
  ENEMY_FIRE_RATE:  1200,   // ms between enemy shots
  ENEMY_DAMAGE:     15,
  ENEMY_BULLET_SPEED: 40,

  // ── ZONE (shrinking circle) ───────────────
  ZONE_START_RADIUS:  190,  // starts almost full map
  ZONE_END_RADIUS:    15,   // final tiny circle
  ZONE_PHASES: [
    { wait: 30, shrinkTime: 30, damage: 2  },  // phase 1
    { wait: 20, shrinkTime: 20, damage: 5  },  // phase 2
    { wait: 15, shrinkTime: 15, damage: 10 },  // phase 3
    { wait: 10, shrinkTime: 10, damage: 20 },  // phase 4
  ],

  // ── OBSTACLES (map objects) ───────────────
  TREE_COUNT:       60,
  ROCK_COUNT:       30,
  BUILDING_COUNT:   12,
};
