import { ActionBase } from "./ActionBase";
import { WorldState } from "../types/goap";

export class WithdrawAction extends ActionBase {
    name = "withdraw";
    roles = ['hauler', 'builder', 'upgrader', 'repairer'];
    preconditions: WorldState = { nearContainerWithEnergy: true, hasEnergy: false };
    effects: WorldState = { hasEnergy: true };

    public getCost(creep: Creep): number { return 3; }

    public execute(creep: Creep): boolean {
        const container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0
        }) as StructureContainer;

        if (container) {
            const result = creep.withdraw(container, RESOURCE_ENERGY);
            return result === OK || creep.store.getFreeCapacity() === 0;
        }
        return true;
    }
}
