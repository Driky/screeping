import { ActionBase } from "./ActionBase";
import { WorldState } from "../types/goap";

export class MoveToContainerAction extends ActionBase {
    name = "moveToContainer";
    roles = ['hauler', 'builder', 'upgrader', 'repairer'];
    preconditions: WorldState = { hasEnergy: false, nearContainer: false };
    effects: WorldState = { nearContainer: true };

    public getCost(creep: Creep): number {
        const container = this.findContainer(creep);
        return container ? creep.pos.getRangeTo(container) : 99;
    }

    public execute(creep: Creep): boolean {
        const container = this.findContainer(creep);
        if (container) {
            creep.moveTo(container, { visualizePathStyle: { stroke: '#00ffff' } });
            return creep.pos.isNearTo(container);
        }
        return true;
    }

    private findContainer(creep: Creep): StructureContainer | null {
        return creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0
        }) as StructureContainer;
    }
}
