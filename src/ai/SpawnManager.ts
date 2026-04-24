export class SpawnManager {
    private static quotas: { [role: string]: number } = {
        harvester: 2,
        upgrader: 2,
        builder: 1
    };

    public static run(room: Room): void {
        const spawns = room.find(FIND_MY_SPAWNS);
        const spawn = spawns.find(s => !s.spawning);
        if (!spawn) return;

        const creeps = room.find(FIND_MY_CREEPS);

        for (const role in this.quotas) {
            const count = creeps.filter(c => c.memory.role === role).length;

            if (count < this.quotas[role]) {
                // Utilise l'énergie MAXIMALE (avec extensions) et non l'énergie actuelle
                this.spawn(spawn, role, room.energyCapacityAvailable);
                break;
            }
        }
    }

    private static spawn(spawn: StructureSpawn, role: string, energyLimit: number): void {
        const name = `${role}_${Game.time}`;
        const body = this.generateBody(role, energyLimit);

        // On essaie de spawn, si on n'a pas assez d'énergie actuelle,
        // le spawn attendra simplement d'être rempli par les harvesters.
        const result = spawn.spawnCreep(body, name, { memory: { role: role } });

        if (result === OK) {
            console.log(`[Spawn] Nouveau ${role} (Coût: ${this.getBodyCost(body)}) : ${name}`);
        }
    }

    private static generateBody(role: string, energyLimit: number): BodyPartConstant[] {
        const body: BodyPartConstant[] = [];
        let cost = 0;

        // Unité de base : [WORK, CARRY, MOVE] = 200 energy
        const baseSet: BodyPartConstant[] = [WORK, CARRY, MOVE];
        const baseCost = 200;

        // On ajoute autant de sets que possible selon la limite d'énergie
        // On limite à 15 pièces (5 sets) pour ne pas épuiser tout le CPU au début
        while (cost + baseCost <= energyLimit && body.length < 15) {
            body.push(...baseSet);
            cost += baseCost;
        }

        // Sécurité : si la pièce est vide et qu'on ne peut rien payer,
        // on retourne au moins un petit corps de survie (300 energy max)
        return body.length > 0 ? body : [WORK, CARRY, MOVE];
    }

    private static getBodyCost(body: BodyPartConstant[]): number {
        return _.sum(body, p => BODYPART_COST[p]);
    }
}

