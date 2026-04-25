import { BuildAction } from "actions/BuildAction";
import { DropAction } from "actions/DropAction";
import { RepairAction } from "actions/RepairAction";
import { ForceDropAction } from "actions/ForceDropAction";
import { HaulerPickupAction } from "actions/HaulerPickupAction";
import { HarvestAction } from "actions/HarvestAction";
import { MoveToConstructionAction } from "actions/MoveToConstructionAction";
import { MoveToContainerAction } from "actions/MoveToContainerAction";
import { MoveToControllerAction } from "actions/MoveToControllerAction";
import { MoveToDroppedAction } from "actions/MoveToDroppedAction";
import { MoveToSourceAction } from "actions/MoveToSourceAction";
import { MoveToTargetAction } from "actions/MoveToTargetAction";
import { PickupAction } from "actions/PickupAction";
import { TransferAction } from "actions/TransferAction";
import { UpgradeControllerAction } from "actions/UpgradeControllerAction";
import { WithdrawAction } from "actions/WithdrawFromContainerAction";
import { GOAPManager } from "ai/GOAPManager";
import { SpawnManager } from "ai/SpawnManager";
import { IAction } from "types/goap";
import { ErrorMapper } from "utils/ErrorMapper";

const allActions: IAction[] = [
    new BuildAction(),
    new DropAction(),
    new ForceDropAction(),
    new HaulerPickupAction(),
    new HarvestAction(),
    new MoveToConstructionAction(),
    new MoveToContainerAction(),
    new MoveToControllerAction(),
    new MoveToDroppedAction(),
    new MoveToSourceAction(),
    new MoveToTargetAction(),
    new PickupAction(),
    new RepairAction(),
    new TransferAction(),
    new UpgradeControllerAction(),
    new WithdrawAction(),
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

        const WALL_REPAIR_TARGET = 10_000;
        const sources = room.find(FIND_SOURCES);
        const sites = room.find(FIND_CONSTRUCTION_SITES);
        const repairTargets = room.find(FIND_STRUCTURES, {
            filter: s => s.hits < s.hitsMax &&
                (s.structureType !== STRUCTURE_WALL || s.hits < WALL_REPAIR_TARGET)
        }) as Structure[];
        SpawnManager.run(room, sources, sites, repairTargets);
        const depositTargets = room.find(FIND_MY_STRUCTURES, {
            filter: (s) => (s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION)
                           && (s as AnyStoreStructure).store.getFreeCapacity(RESOURCE_ENERGY) > 0
        }) as AnyStoreStructure[];
        const containers = room.find(FIND_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_CONTAINER
        }) as StructureContainer[];
        const droppedEnergy = room.find(FIND_DROPPED_RESOURCES, {
            filter: r => r.resourceType === RESOURCE_ENERGY
        });
        const roomCreeps = _.filter(Game.creeps, (c) => c.room.name === room.name);

        for (const creep of roomCreeps) {
            const startCpu = Game.cpu.getUsed();
            // On passe les données déjà trouvées au manager
            manager.run(creep, sources, sites, depositTargets, containers, droppedEnergy, repairTargets);

            // Debug CPU (optionnel)
            const used = Game.cpu.getUsed() - startCpu;
            if (used > 2) {
                console.log(`[CPU Warning] ${creep.name} a utilisé ${used.toFixed(2)} units.`);
            }
        }

    }
});
