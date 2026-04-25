const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 } as const;
type Level = keyof typeof LEVELS;

export function log(subsystem: string, message: string, level: Level = 'info', role?: string): void {
    const maxLevel = (Memory.logLevel ?? 'info') as Level;
    if (LEVELS[level] > LEVELS[maxLevel]) return;

    const subFilter = Memory.logSubsystems;
    if (subFilter !== undefined) {
        const ok = Array.isArray(subFilter) ? subFilter.includes(subsystem) : subFilter === subsystem;
        if (!ok) return;
    }

    if (role !== undefined) {
        const roleFilter = Memory.logRoles;
        if (roleFilter !== undefined) {
            const ok = Array.isArray(roleFilter) ? roleFilter.includes(role) : roleFilter === role;
            if (!ok) return;
        }
    }

    console.log(`[${subsystem}] ${message}`);
}
