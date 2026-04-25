import { ActionBase } from "./ActionBase";
import { WorldState } from "../types/goap";

export class MoveToDroppedAction extends ActionBase {
    name = "moveToDropped";
    roles = ['hauler', 'builder', 'upgrader', 'repairer'];
    preconditions: WorldState = { nearDropped: false, hasEnergy: false };
    effects: WorldState = { nearDropped: true };

    public getCost(creep: Creep): number {
        const dropped = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
            filter: r => r.resourceType === RESOURCE_ENERGY
        });
        return dropped ? creep.pos.getRangeTo(dropped) : 99;
    }

    public execute(creep: Creep): boolean {
        const dropped = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
            filter: r => r.resourceType === RESOURCE_ENERGY
        });
        if (!dropped) return true;
        creep.moveTo(dropped, { visualizePathStyle: { stroke: '#ffff00' } });
        return creep.pos.isNearTo(dropped);
    }
}
