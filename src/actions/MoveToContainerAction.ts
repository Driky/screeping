import { ActionBase } from "./ActionBase";
import { WorldState } from "../types/goap";

export class MoveToContainerAction extends ActionBase {
    name = "moveToContainer";
    roles = ['hauler', 'builder', 'upgrader', 'repairer'];
    preconditions: WorldState = { hasEnergy: false, nearContainerWithEnergy: false };
    effects: WorldState = { nearContainerWithEnergy: true };

    public getCost(creep: Creep): number {
        const container = this.findContainer(creep);
        return container ? creep.pos.getRangeTo(container) : 99;
    }

    public execute(creep: Creep): boolean {
        const container = this.findContainer(creep);
        if (!container) { creep.memory.plan = []; return true; }
        creep.moveTo(container, { visualizePathStyle: { stroke: '#00ffff' } });
        return creep.pos.isNearTo(container);
    }

    private findContainer(creep: Creep): StructureContainer | null {
        const ctrl = creep.room.controller;
        const all = (creep.room.find(FIND_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0
        }) as StructureContainer[]).filter(c => !ctrl || c.pos.getRangeTo(ctrl) > 3);
        if (!all.length) return null;

        if (creep.memory.assignedSourceId) {
            const source = Game.getObjectById(creep.memory.assignedSourceId);
            if (source) {
                const zoned = all.filter(c => source.pos.getRangeTo(c) <= 3);
                if (zoned.length) return creep.pos.findClosestByRange(zoned);
            }
        }
        return creep.pos.findClosestByRange(all);
    }
}
