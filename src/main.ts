import { BuildAction } from "actions/BuildAction";
import { HarvestAction } from "actions/HarvestAction";
import { MoveToControllerAction } from "actions/MoveToControllerAction";
import { MoveToSourceAction } from "actions/MoveToSourceAction";
import { MoveToTargetAction } from "actions/MoveToTargetAction";
import { TransferAction } from "actions/TransferAction";
import { UpgradeControllerAction } from "actions/UpgradeControllerAction";
import { GOAPManager } from "ai/GOAPManager";
import { IAction } from "types/goap";
import { ErrorMapper } from "utils/ErrorMapper";

const allActions: IAction[] = [
    new HarvestAction(),
    new MoveToSourceAction(),
    new UpgradeControllerAction(),
    new MoveToControllerAction(),
    new TransferAction(),
    new BuildAction(),
    new MoveToTargetAction()
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

    // 2. Spawning
    const harvesters = _.filter(Game.creeps, (c) => c.memory.role === 'harvester');
    if (harvesters.length < 2) {
        Game.spawns['Spawn1'].spawnCreep([WORK, CARRY, MOVE], `H_${Game.time}`,
            { memory: { role: 'harvester' } });
    }

    // ON CACHE LES DONNÉES UNE FOIS PAR PIÈCE
    for (const roomName in Game.rooms) {
        const room = Game.rooms[roomName];
        const sources = room.find(FIND_SOURCES);
        const sites = room.find(FIND_CONSTRUCTION_SITES);

        // On récupère les creeps de cette pièce
        const roomCreeps = _.filter(Game.creeps, (c) => c.room.name === room.name);

        for (const creep of roomCreeps) {
            // On passe les données déjà trouvées au manager
            manager.run(creep, sources, sites);
        }
    }
});
