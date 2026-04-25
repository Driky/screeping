export class SpawnManager {
    public static run(room: Room, sources: Source[], sites: ConstructionSite[], repairTargets: Structure[]): void {
        const spawns = room.find(FIND_MY_SPAWNS);
        const spawn = spawns.find(s => !s.spawning);
        if (!spawn) return;

        const creeps = room.find(FIND_MY_CREEPS);
        const haulerCount = creeps.filter(c => c.memory.role === 'hauler').length;

        const quotas: { [role: string]: number } = {
            harvester: haulerCount === 0 ? 1 : 0,
            miner: sources.length,
            hauler: sources.length + 1,
            upgrader: 1,
            builder: sites.length > 0 ? 2 : 0,
            repairer: repairTargets.length > 0 ? 1 : 0,
        };

        for (const role in quotas) {
            const count = creeps.filter(c => c.memory.role === role).length;

            if (count < quotas[role]) {
                let sourceId: Id<Source> | undefined;
                if (role === 'miner') {
                    const taken = creeps
                        .filter(c => c.memory.role === 'miner' && c.memory.sourceId)
                        .map(c => c.memory.sourceId as Id<Source>);
                    sourceId = sources.find(s => !taken.includes(s.id))?.id;
                }
                let assignedSourceId: Id<Source> | undefined;
                if (role === 'hauler') {
                    const counts = new Map(sources.map(s => [s.id, 0]));
                    creeps
                        .filter(c => c.memory.role === 'hauler' && c.memory.assignedSourceId)
                        .forEach(c => {
                            const sid = c.memory.assignedSourceId!;
                            counts.set(sid, (counts.get(sid) ?? 0) + 1);
                        });
                    assignedSourceId = [...counts.entries()]
                        .sort((a, b) => a[1] - b[1])[0]?.[0] as Id<Source> | undefined;
                }
                this.spawn(spawn, role, room.energyAvailable, sourceId, assignedSourceId);
                break;
            }
        }
    }

    private static spawn(spawn: StructureSpawn, role: string, energyLimit: number, sourceId?: Id<Source>, assignedSourceId?: Id<Source>): void {
        const name = `${role}_${Game.time}`;
        const body = this.generateBody(role, energyLimit);
        const memory: CreepMemory = {
            role,
            ...(sourceId !== undefined && { sourceId }),
            ...(assignedSourceId !== undefined && { assignedSourceId }),
        };

        // On essaie de spawn, si on n'a pas assez d'énergie actuelle,
        // le spawn attendra simplement d'être rempli par les harvesters.
        const result = spawn.spawnCreep(body, name, { memory });

        if (result === OK) {
            console.log(`[Spawn] Nouveau ${role} (Coût: ${this.getBodyCost(body)}) : ${name}`);
        } else if (result !== ERR_BUSY) {
            console.log(`[Spawn] Échec ${role} (code: ${result}, coût: ${this.getBodyCost(body)}, énergie: ${spawn.room.energyAvailable})`);
        }
    }

    private static generateBody(role: string, energyLimit: number): BodyPartConstant[] {
        let body: BodyPartConstant[] = [];

        if (role === 'miner') {
            // Un mineur a besoin de 5 WORK pour vider une source (2 energy/tick par WORK)
            // 5 WORK + 1 MOVE = 550 energy.
            // On commence petit et on ajoute des WORK selon l'énergie.
            body = [MOVE, WORK, WORK];
            let cost = 300;
            while (cost + 100 <= energyLimit && body.filter(p => p === WORK).length < 5) {
                body.push(WORK);
                cost += 100;
            }
        }
        else if (role === 'hauler') {
            // Le transporteur doit être rapide : 1 MOVE pour 1 CARRY
            // 1 MOVE + 1 CARRY = 100 energy.
            let cost = 0;
            while (cost + 100 <= energyLimit && body.length < 20) {
                body.push(MOVE, CARRY);
                cost += 100;
            }
        }
        else if (role === 'upgrader') {
            // WORK-heavy: base [MOVE, CARRY, WORK] then add [WORK, CARRY] pairs
            body = [MOVE, CARRY, WORK];
            let cost = 200;
            while (cost + 150 <= energyLimit && body.length < 15) {
                body.push(WORK, CARRY);
                cost += 150;
            }
        }
        else if (role === 'harvester') {
            body = [WORK, CARRY, MOVE];
            let cost = 200;
            while (cost + 100 <= energyLimit && body.length < 15) {
                body.push(CARRY, MOVE);
                cost += 100;
            }
        }
        else if (role === 'builder' || role === 'repairer') {
            // Balanced triplets [WORK, CARRY, MOVE] for mobility and carry capacity
            let cost = 0;
            while (cost + 200 <= energyLimit && body.length < 15) {
                body.push(WORK, CARRY, MOVE);
                cost += 200;
            }
        }
        else {
            // Harvester fallback: [WORK, CARRY, MOVE] triplets
            let cost = 0;
            while (cost + 200 <= energyLimit && body.length < 15) {
                body.push(WORK, CARRY, MOVE);
                cost += 200;
            }
        }

        return body.length > 0 ? body : [WORK, CARRY, MOVE];
    }

    private static getBodyCost(body: BodyPartConstant[]): number {
        return _.sum(body, p => BODYPART_COST[p]);
    }
}

