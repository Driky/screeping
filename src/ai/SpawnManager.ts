export class SpawnManager {
    public static run(room: Room, sources: Source[]): void {
        const spawns = room.find(FIND_MY_SPAWNS);
        const spawn = spawns.find(s => !s.spawning);
        if (!spawn) return;

        const creeps = room.find(FIND_MY_CREEPS);


        const roomConstructionSites = room.find(FIND_CONSTRUCTION_SITES);
        // console.log("Room: " + room.name + " construction sites: " + roomConstructionSites);
        const quotas: { [role: string]: number } = {
            miner: sources.length,
            hauler: sources.length + 1,
            upgrader: 1,
            builder: roomConstructionSites.length > 0 ? 2 : 0,
        };

        for (const role in quotas) {
            const count = creeps.filter(c => c.memory.role === role).length;

            if (count < quotas[role]) {
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
        else {
            // Polyvalent (Upgrader/Builder) : [WORK, CARRY, MOVE]
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

