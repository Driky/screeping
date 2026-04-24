import { BuildAction } from "actions/BuildAction";
import { HarvestAction } from "actions/HarvestAction";
import { MoveToConstructionAction } from "actions/MoveToConstructionAction";
import { MoveToControllerAction } from "actions/MoveToControllerAction";
import { MoveToSourceAction } from "actions/MoveToSourceAction";
import { MoveToTargetAction } from "actions/MoveToTargetAction";
import { TransferAction } from "actions/TransferAction";
import { UpgradeControllerAction } from "actions/UpgradeControllerAction";
import { GOAPManager } from "ai/GOAPManager";
import { SpawnManager } from "ai/SpawnManager";
import { IAction } from "types/goap";
import { ErrorMapper } from "utils/ErrorMapper";

const allActions: IAction[] = [
    new HarvestAction(),
    new MoveToSourceAction(),
    new UpgradeControllerAction(),
    new MoveToControllerAction(),
    new TransferAction(),
    new BuildAction(),
    new MoveToTargetAction(),
    new MoveToConstructionAction(),
];

const manager = new GOAPManager(allActions);

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  console.log(`Current game tick is ${Game.time}`);

  // 1. Cleanup
    for (const name in Memory.creeps) {
        if (!(name in Game.creeps)) {
            delete Memory.creeps[name];
        }
    }

    // ON CACHE LES DONNÉES UNE FOIS PAR PIÈCE
    for (const roomName in Game.rooms) {
        const room = Game.rooms[roomName];

        SpawnManager.run(room);

        const sources = room.find(FIND_SOURCES);
        const sites = room.find(FIND_CONSTRUCTION_SITES);
        const depositTargets = room.find(FIND_MY_STRUCTURES, {
            filter: (s) => (s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION)
                           && (s as AnyStoreStructure).store.getFreeCapacity(RESOURCE_ENERGY) > 0
        }) as AnyStoreStructure[];
        const roomCreeps = _.filter(Game.creeps, (c) => c.room.name === room.name);

        for (const creep of roomCreeps) {
            const startCpu = Game.cpu.getUsed();
            // On passe les données déjà trouvées au manager
            manager.run(creep, sources, sites, depositTargets);

            // Debug CPU (optionnel)
            const used = Game.cpu.getUsed() - startCpu;
            if (used > 2) {
                console.log(`[CPU Warning] ${creep.name} a utilisé ${used.toFixed(2)} units.`);
            }
        }

        // 3. Spawning basique (exemple pour 1 Harvester)
        const spawn = room.find(FIND_MY_SPAWNS)[0];
        if (spawn && roomCreeps.length < 3 && !spawn.spawning) {
            spawn.spawnCreep([WORK, CARRY, MOVE], `Worker_${Game.time}`, {
                memory: { role: 'harvester' }
            });
        }
    }
});
