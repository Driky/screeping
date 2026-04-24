import { BuildAction } from "actions/BuildAction";
import { HarvestAction } from "actions/HarvestAction";
import { MoveToControllerAction } from "actions/MoveToControllerAction";
import { MoveToSourceAction } from "actions/MoveToSourceAction";
import { TransferAction } from "actions/TransferAction";
import { UpgradeAction } from "actions/UpgradeAction";
import { GOAPManager } from "ai/GOAPManager";
import { GOAPPlanner } from "ai/GOAPPlanner";
import { WorldSensor } from "ai/WorldSensor";
import { IAction, WorldState } from "types/goap";
import { ErrorMapper } from "utils/ErrorMapper";

// Syntax for adding properties to `global` (ex "global.log")
declare const global: {
  log: any;
}

const planner = new GOAPPlanner();
const allActions: IAction[] = [
    new HarvestAction(),
    new MoveToSourceAction(),
    new UpgradeAction(),
    new MoveToControllerAction(),
    new TransferAction(),
    new BuildAction()
];

const manager = new GOAPManager([
    new HarvestAction(),
    new MoveToSourceAction(),
    new UpgradeAction(),
    new MoveToControllerAction(),
    new TransferAction(),
    new BuildAction()
]);

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

    // 3. Exécution des creeps
    for (const name in Game.creeps) {
        const creep = Game.creeps[name];

        for (const name in Game.creeps) {
            manager.run(Game.creeps[name]);
        }
    }
});
