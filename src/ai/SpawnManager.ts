export class SpawnManager {
    // Définition des quotas de population
    private static quotas: { [role: string]: number } = {
        harvester: 2,
        upgrader: 2,
        builder: 1
    };

    public static run(room: Room): void {
        const spawn = room.find(FIND_MY_SPAWNS)[0];
        if (!spawn || spawn.spawning) return;

        const creeps = room.find(FIND_MY_CREEPS);

        // On vérifie chaque rôle par ordre de priorité
        for (const role in this.quotas) {
            const count = creeps.filter(c => c.memory.role === role).length;

            if (count < this.quotas[role]) {
                this.spawn(spawn, role);
                break; // On ne spawn qu'un creep à la fois
            }
        }
    }

    private static spawn(spawn: StructureSpawn, role: string): void {
        const name = `${role}_${Game.time}`;

        // Corps de base pour le début de partie (300 energy)
        const body: BodyPartConstant[] = [WORK, CARRY, MOVE];

        // Tentative de spawn
        const result = spawn.spawnCreep(body, name, {
            memory: { role: role }
        });

        if (result === OK) {
            console.log(`[Spawn] Nouveau ${role} en production : ${name}`);
        }
    }
}
