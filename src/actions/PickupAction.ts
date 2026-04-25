import { ActionBase } from "./ActionBase";
import { WorldState } from "../types/goap";

export class PickupAction extends ActionBase {
    name = "pickup";
    roles = ['builder', 'upgrader', 'repairer'];
    preconditions: WorldState = { nearDropped: true, hasEnergy: false };
    effects: WorldState = { hasEnergy: true };

    public getCost(creep: Creep): number {
        const dropped = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
            filter: r => r.resourceType === RESOURCE_ENERGY
        });
        if (dropped) {
            const amountBonus = Math.min(dropped.amount / 100, 5);
            return 1 - amountBonus;
        }
        return 5;
    }

    public execute(creep: Creep): boolean {
        const dropped = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
            filter: r => r.resourceType === RESOURCE_ENERGY
        });
        if (!dropped) return true;
        const result = creep.pickup(dropped);
        if (result === ERR_NOT_IN_RANGE) return true; // abort, force replan
        return result === OK || creep.store.getFreeCapacity() === 0;
    }
}
