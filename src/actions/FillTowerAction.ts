import { ActionBase } from "./ActionBase";
import { WorldState } from "../types/goap";

export class FillTowerAction extends ActionBase {
    name = "fillTower";
    roles = ['hauler'];
    preconditions: WorldState = { hasEnergy: true, nearTower: true };
    effects: WorldState = { targetFull: true };

    public getCost(_creep: Creep): number { return 1; }

    public execute(creep: Creep): boolean {
        const tower = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_TOWER &&
                (s as StructureTower).store.getFreeCapacity(RESOURCE_ENERGY) > 0
        }) as StructureTower | null;
        if (!tower) { creep.memory.plan = []; return true; }
        const result = creep.transfer(tower, RESOURCE_ENERGY);
        return result === OK || creep.store[RESOURCE_ENERGY] === 0;
    }
}
