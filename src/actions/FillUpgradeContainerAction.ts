import { ActionBase } from "./ActionBase";
import { WorldState } from "../types/goap";

export class FillUpgradeContainerAction extends ActionBase {
    name = "fillUpgradeContainer";
    roles = ['hauler'];
    preconditions: WorldState = { hasEnergy: true, nearUpgradeContainer: true };
    effects: WorldState = { targetFull: true };

    public getCost(_creep: Creep): number { return 1; }

    public execute(creep: Creep): boolean {
        const ctrl = creep.room.controller;
        if (!ctrl) { creep.memory.plan = []; return true; }
        const containers = creep.room.find(FIND_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_CONTAINER
        }) as StructureContainer[];
        const target = containers.find(c => c.pos.getRangeTo(ctrl) <= 3);
        if (!target) { creep.memory.plan = []; return true; }
        const result = creep.transfer(target, RESOURCE_ENERGY);
        if (result === ERR_FULL) {
            creep.memory.nextPlanTick = Game.time + 5;
            return true;
        }
        return result === OK || creep.store[RESOURCE_ENERGY] === 0;
    }
}
