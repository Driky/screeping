import { ActionBase } from "./ActionBase";
import { WorldState } from "../types/goap";

export class MoveToTargetAction extends ActionBase {
    name = "moveToTarget";
    roles = ['hauler', 'builder', 'upgrader', 'harvester'];
    preconditions: WorldState = { atTarget: false };
    effects: WorldState = { atTarget: true };

    public getCost(creep: Creep): number {
        const target = this.findTarget(creep);
        return target ? creep.pos.getRangeTo(target) : 999;
    }

    public execute(creep: Creep): boolean {
        const target = this.findTarget(creep);
        if (target) {
            creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
            return creep.pos.isNearTo(target);
        }
        return true;
    }

    private findTarget(creep: Creep): Structure | null {
        return creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
            filter: (s) => (s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION)
                           && (s as AnyStoreStructure).store.getFreeCapacity(RESOURCE_ENERGY) > 0
        });
    }
}
