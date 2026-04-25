export class TowerManager {
    public static run(room: Room): void {
        const towers = room.find(FIND_MY_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_TOWER
        }) as StructureTower[];

        if (!towers.length) return;

        const hostiles = room.find(FIND_HOSTILE_CREEPS);
        const damagedFriendly = room.find(FIND_MY_CREEPS, {
            filter: c => c.hits < c.hitsMax
        });
        const damagedStructures = room.find(FIND_STRUCTURES, {
            filter: s => s.hits < s.hitsMax * 0.5 &&
                s.structureType !== STRUCTURE_WALL &&
                s.structureType !== STRUCTURE_RAMPART
        });

        for (const tower of towers) {
            if (hostiles.length > 0) {
                tower.attack(tower.pos.findClosestByRange(hostiles)!);
            } else if (damagedFriendly.length > 0) {
                const target = damagedFriendly.reduce((a, b) => a.hits < b.hits ? a : b);
                tower.heal(target);
            } else if (damagedStructures.length > 0) {
                const target = damagedStructures.reduce((a, b) => a.hits < b.hits ? a : b);
                tower.repair(target);
            }
        }
    }
}
