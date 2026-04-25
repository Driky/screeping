import { ActionBase } from "./ActionBase";
import { WorldState } from "../types/goap";

const WALL_REPAIR_TARGET = 10_000;

export class RepairAction extends ActionBase {
    name = "repair";
    roles = ['repairer', 'builder'];
    preconditions: WorldState = { hasEnergy: true };
    effects: WorldState = { structureRepaired: true };

    public getCost(creep: Creep): number {
        const t = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (s) => s.hits < s.hitsMax &&
                (s.structureType !== STRUCTURE_WALL || s.hits < WALL_REPAIR_TARGET)
        });
        return t ? creep.pos.getRangeTo(t) : 99;
    }

    public execute(creep: Creep): boolean {
        const target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (s) => s.hits < s.hitsMax &&
                (s.structureType !== STRUCTURE_WALL || s.hits < WALL_REPAIR_TARGET)
        });

        if (target) {
            const result = creep.repair(target);
            if (result === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: '#ff0000' } });
                return false;
            }
            return creep.store[RESOURCE_ENERGY] === 0 || target.hits === target.hitsMax;
        }
        return true;
    }
}
