# Screeping

A self-sustaining Screeps colony AI written in TypeScript, driven by a GOAP (Goal-Oriented Action Planning) engine. Targets automated RCL 1→8 progression with full economic self-management and room defense.

## Dev Setup

**Prerequisites:** Node.js 18+, pnpm

```bash
pnpm install
cp screeps.sample.json screeps.json   # fill in your token/username
```

**Workflow:**

```bash
pnpm exec tsc --noEmit          # type-check
pnpm run push-main              # build + deploy to main shard
pnpm run watch-main             # watch + auto-push on save
```

`screeps.json` holds server destinations (main, pserver, sim). Each key maps to a `rollup --environment DEST:<key>` build target.

## Architecture

```
main.ts
├── ConstructionManager.run(room)   every 50 ticks — auto-place sites by RCL
├── TowerManager.run(room)          every tick — towers attack/heal/repair
├── SpawnManager.run(room, ...)     every tick — dynamic quota spawning
└── GOAPManager.run(creep, ...)     every tick per creep — plan + execute
```

### GOAP Engine

Each creep plans its own action sequence each tick using a backward A\* planner:

1. **WorldSensor** reads the game state into a flat `WorldState` record (`hasEnergy`, `nearContainer`, `nearStorage`, `nearEnemy`, …).
2. **GOAPPlanner** searches backward from the creep's goal (e.g. `{ targetFull: true }`) through available actions using `f = g + h` (cost-so-far + unsatisfied-state-count heuristic).
3. The resulting plan is stored in `creep.memory.plan` and executed action-by-action. If world state diverges from what an action assumed, the creep replans immediately.

**Actions** (`src/actions/`) implement `IAction`:
- `preconditions` — WorldState that must hold before the action runs
- `effects` — WorldState changes the action produces
- `roles` — which roles can use this action (omit = all roles)
- `getCost(creep)` — typically distance, so the planner prefers closer targets
- `execute(creep)` — returns `true` when the action is complete

### Roles and Goals

| Role | Goal | Key actions |
|---|---|---|
| harvester | `targetFull` | harvest → transfer to spawn/extension |
| miner | `targetFull` | harvest → drop near container |
| hauler | `targetFull` | pickup/withdraw → transfer to spawn/extension/storage/link/tower; also fill upgrade container |
| upgrader | `controllerUpgraded` | withdraw (upgrade container/container/storage/link) → upgrade controller |
| builder | `buildTargetDone` | withdraw → build; fallback to repair or transfer |
| repairer | `structureRepaired` | withdraw → repair |
| defender | `enemyDead` | move to enemy → attack |
| remoteMiner | `hasEnergy` | move to remote source → harvest |
| remoteHauler | `targetFull` | move to home room → pickup/withdraw → transfer |
| claimer | `controllerClaimed` | move to foreign controller → claim |
| reserver | `controllerReserved` | move to foreign controller → reserve |

### Managers

| Manager | Responsibility |
|---|---|
| **SpawnManager** | Dynamic quotas per role (upgrader base 3, scales to 4 with storage energy); bootstrap guard prevents deadlock when all creeps die; bodies sized to `energyCapacityAvailable` |
| **ConstructionManager** | Places extensions/containers/towers/storage/terminal/upgrade-container as RCL rises; max 5 queued sites |
| **TowerManager** | Towers attack nearest hostile, heal most-damaged friendly, repair structures below 50% hits |

### Key Files

```
src/
  main.ts                     — entry point, wires all managers and actions
  ai/
    GOAPPlanner.ts            — backward A* planner
    GOAPManager.ts            — per-creep plan/execute loop + goal definitions
    WorldSensor.ts            — game state → WorldState
    SpawnManager.ts           — spawn logic + body generation
    ConstructionManager.ts    — RCL-gated site placement
    TowerManager.ts           — tower combat/repair loop
  actions/                    — one file per IAction implementation
  types/
    goap.d.ts                 — WorldState type + IAction interface
  types.d.ts                  — CreepMemory + Memory extensions
```

## Runtime Flags (Memory)

Set via the Screeps console:

```js
// Logging (structured logger)
Memory.logLevel = 'debug'           // 'error' | 'warn' | 'info' (default) | 'debug'
Memory.logSubsystems = 'manager'    // filter to one subsystem, or array ['manager','planner']
Memory.logRoles = 'builder'         // filter to one role, or array ['builder','hauler']

// Creep speech
Memory.sayEnabled = true            // creeps say their current action
Memory.sayRoleFilter = 'hauler'     // limit say to one role (or array)
```
