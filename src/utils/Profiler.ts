interface SubsystemStat { cpu: number; calls: number; }
interface CreepStat { name: string; role: string; cpu: number; label: 'exec' | 'planned' | 'cooldown'; }
interface PlanRoleStat { success: number; fail: number; totalIter: number; maxIter: number; }

let _enabled = false;
let _verbose = false;
let _subsystems: { [key: string]: SubsystemStat } = {};
let _creeps: CreepStat[] = [];
let _planRoles: { [role: string]: PlanRoleStat } = {};
let _cooldownSkips = 0;
let _tickStart = 0;

export function startTick(): void {
    _enabled = Memory.profiling === true;
    _verbose = Memory.profilingVerbose === true;
    if (!_enabled) return;
    _subsystems = {};
    _creeps = [];
    _planRoles = {};
    _cooldownSkips = 0;
    _tickStart = Game.cpu.getUsed();
}

export function endTick(): void {
    if (!_enabled) return;

    const totalCpu = Game.cpu.getUsed() - _tickStart;
    const lines: string[] = [];
    lines.push(`[PROFILER] Tick ${Game.time} | ${totalCpu.toFixed(2)} CPU total | bucket: ${Game.cpu.bucket}`);

    lines.push('  Subsystems:');
    for (const name of Object.keys(_subsystems)) {
        const s = _subsystems[name];
        const perCreep = name === 'world-sensor' && s.calls > 0
            ? ` → ${(s.cpu / s.calls).toFixed(2)}/creep`
            : '';
        lines.push(`    ${name.padEnd(14)}: ${s.cpu.toFixed(2).padStart(5)} CPU (${s.calls}x)${perCreep}`);
    }

    let totalAttempts = 0, totalOk = 0, totalFail = 0, totalIter = 0, maxIter = 0;
    for (const stat of Object.values(_planRoles)) {
        totalAttempts += stat.success + stat.fail;
        totalOk += stat.success;
        totalFail += stat.fail;
        totalIter += stat.totalIter;
        if (stat.maxIter > maxIter) maxIter = stat.maxIter;
    }
    const avgIter = totalAttempts > 0 ? (totalIter / totalAttempts).toFixed(1) : '0';
    lines.push(`  Planning: ${totalAttempts} attempts | ${totalOk} ok | ${totalFail} fail | ${_cooldownSkips} cooldown-skips`);
    lines.push(`  Iterations: avg ${avgIter}  max ${maxIter}`);

    if (Object.keys(_planRoles).length > 0) {
        lines.push('  By role:');
        for (const [role, stat] of Object.entries(_planRoles)) {
            const roleAttempts = stat.success + stat.fail;
            const roleAvg = roleAttempts > 0 ? (stat.totalIter / roleAttempts).toFixed(1) : '0';
            let roleLine = `    ${role.padEnd(10)} ok=${stat.success}  fail=${stat.fail}  avgIter=${roleAvg}`;
            if (stat.fail > 0) roleLine += `  maxIter=${stat.maxIter}  ← WARN`;
            lines.push(roleLine);
        }
    }

    if (_verbose && _creeps.length > 0) {
        lines.push('  Per-Creep (sorted by CPU):');
        const sorted = [..._creeps].sort((a, b) => b.cpu - a.cpu);
        for (const c of sorted) {
            lines.push(`    ${c.name.padEnd(14)} [${c.role.padEnd(10)}]  ${c.cpu.toFixed(2)} CPU  [${c.label}]`);
        }
    }

    console.log(lines.join('\n'));
}

export function measure<T>(subsystem: string, fn: () => T): T {
    if (!_enabled) return fn();
    const before = Game.cpu.getUsed();
    const result = fn();
    const elapsed = Game.cpu.getUsed() - before;
    if (!_subsystems[subsystem]) _subsystems[subsystem] = { cpu: 0, calls: 0 };
    _subsystems[subsystem].cpu += elapsed;
    _subsystems[subsystem].calls++;
    return result;
}

export function recordCreep(name: string, role: string, cpu: number, label: 'exec' | 'planned' | 'cooldown'): void {
    if (!_enabled) return;
    _creeps.push({ name, role, cpu, label });
}

export function recordPlannerResult(role: string, iterations: number, success: boolean): void {
    if (!_enabled) return;
    if (!_planRoles[role]) _planRoles[role] = { success: 0, fail: 0, totalIter: 0, maxIter: 0 };
    const stat = _planRoles[role];
    if (success) stat.success++;
    else stat.fail++;
    stat.totalIter += iterations;
    if (iterations > stat.maxIter) stat.maxIter = iterations;
}

export function recordCooldownSkip(): void {
    if (!_enabled) return;
    _cooldownSkips++;
}
