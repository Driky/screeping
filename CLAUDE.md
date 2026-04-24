# Claude settings for screeping

## Stack

- TypeScript + Rollup, deployed to Screeps via `pnpm run push-main`
- GOAP-based AI in `src/ai/`, per-role actions in `src/actions/`
- Type-check: `pnpm exec tsc --noEmit`
