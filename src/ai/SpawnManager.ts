export class SpawnManager {
    public static run(room: Room, sources: Source[], sites: ConstructionSite[], repairTargets: Structure[]): void {
        const spawns = room.find(FIND_MY_SPAWNS);
        const spawn = spawns.find(s => !s.spawning);
        if (!spawn) return;

        const creeps = room.find(FIND_MY_CREEPS);
        const harvesterCount = creeps.filter(c => c.memory.role === 'harvester').length;
        const minerCount = creeps.filter(c => c.memory.role === 'miner').length;
        const haulerCount = creeps.filter(c => c.memory.role === 'hauler').length;

        // Bootstrap guard: if nothing can deliver energy to spawn, force a minimal harvester
        const canFeedSpawn = harvesterCount > 0 || (haulerCount > 0 && minerCount > 0);
        if (!canFeedSpawn) {
            this.spawn(spawn, 'harvester', room.energyAvailable, undefined, undefined);
            return;
        }

        const containers = room.find(FIND_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_CONTAINER
        }) as StructureContainer[];

        const anyContainerOverfull = containers.some(c =>
            c.store.getUsedCapacity(RESOURCE_ENERGY) / c.store.getCapacity(RESOURCE_ENERGY) > 0.7
        );

        const storageEnergy = room.storage?.store.getUsedCapacity(RESOURCE_ENERGY) ?? 0;

        const hostileCount = room.find(FIND_HOSTILE_CREEPS).length;

        // Priority ordering matters: define roles in spawn priority order
        const quotas: { [role: string]: number } = {
            harvester: haulerCount === 0 ? 1 : 0,
            miner: sources.length,
            hauler: sources.length + 1 + (anyContainerOverfull ? 1 : 0),
            upgrader: Math.min(4, 1 + Math.floor(storageEnergy / 100000)),
            builder: sites.length === 0 ? 0 : Math.min(3, Math.ceil(sites.length / 3)),
            repairer: repairTargets.length > 0 ? 1 : 0,
            defender: hostileCount > 0 ? 1 : 0,
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
                this.spawn(spawn, role, room.energyCapacityAvailable, sourceId, assignedSourceId);
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

        const result = spawn.spawnCreep(body, name, { memory });

        if (result === OK) {
            console.log(`[Spawn] ${role} (cost: ${this.getBodyCost(body)}, energyCap: ${energyLimit}): ${name}`);
        } else if (result !== ERR_BUSY && result !== ERR_NOT_ENOUGH_ENERGY) {
            console.log(`[Spawn] Failed ${role} (code: ${result}, cost: ${this.getBodyCost(body)}, energyAvail: ${spawn.room.energyAvailable})`);
        }
    }

    private static generateBody(role: string, energyLimit: number): BodyPartConstant[] {
        let body: BodyPartConstant[] = [];

        if (role === 'miner') {
            body = [MOVE, WORK, WORK];
            let cost = 300;
            while (cost + 100 <= energyLimit && body.filter(p => p === WORK).length < 5) {
                body.push(WORK);
                cost += 100;
            }
        }
        else if (role === 'hauler') {
            let cost = 0;
            while (cost + 100 <= energyLimit && body.length < 20) {
                body.push(MOVE, CARRY);
                cost += 100;
            }
        }
        else if (role === 'upgrader') {
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
        else if (role === 'defender') {
            // Base: [TOUGH, MOVE, ATTACK, ATTACK, MOVE] = 290 energy
            body = [TOUGH, MOVE, ATTACK, MOVE];
            let cost = 230;
            while (cost + 80 <= energyLimit && body.filter(p => p === ATTACK).length < 6) {
                body.push(ATTACK, MOVE);
                cost += 130;
            }
        }
        else if (role === 'builder' || role === 'repairer') {
            let cost = 0;
            while (cost + 200 <= energyLimit && body.length < 15) {
                body.push(WORK, CARRY, MOVE);
                cost += 200;
            }
        }
        else {
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
