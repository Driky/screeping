import { ActionBase } from "./ActionBase";
import { WorldState } from "../types/goap";

export class MoveToDroppedAction extends ActionBase {
    name = "moveToDropped";
    roles = ['hauler', 'builder', 'upgrader', 'repairer', 'harvester'];
    preconditions: WorldState = { nearDropped: false, hasEnergy: false };
    effects: WorldState = { nearDropped: true };

    public getCost(creep: Creep): number {
        const dropped = this.findDropped(creep);
        return dropped ? creep.pos.getRangeTo(dropped) : 99;
    }

    public execute(creep: Creep): boolean {
        const dropped = this.findDropped(creep);
        if (!dropped) { creep.memory.plan = []; return true; }
        creep.moveTo(dropped, { range: 1, visualizePathStyle: { stroke: '#ffff00' } });
        return creep.pos.isNearTo(dropped);
    }

    private findDropped(creep: Creep): Resource | null {
        const all = creep.room.find(FIND_DROPPED_RESOURCES, {
            filter: r => r.resourceType === RESOURCE_ENERGY
        });
        if (!all.length) return null;

        if (creep.memory.assignedSourceId) {
            const source = Game.getObjectById(creep.memory.assignedSourceId);
            if (source) {
                const zoned = all.filter(r => source.pos.getRangeTo(r) <= 3);
                if (zoned.length) return creep.pos.findClosestByRange(zoned);
            }
        }
        return creep.pos.findClosestByRange(all);
    }
}
