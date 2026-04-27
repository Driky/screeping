import { ActionBase } from "./ActionBase";
import { WorldState } from "../types/goap";

export class MoveToUpgradeContainerAction extends ActionBase {
    name = "moveToUpgradeContainer";
    roles = ['hauler'];
    preconditions: WorldState = { nearUpgradeContainer: false, hasEnergy: true };
    effects: WorldState = { nearUpgradeContainer: true };

    public getCost(creep: Creep): number {
        const target = this.findUpgradeContainer(creep);
        return target ? creep.pos.getRangeTo(target) : 99;
    }

    public execute(creep: Creep): boolean {
        const target = this.findUpgradeContainer(creep);
        if (!target) {
            creep.memory.nextPlanTick = Game.time + 5;
            creep.memory.plan = [];
            return true;
        }
        creep.moveTo(target, { visualizePathStyle: { stroke: '#ff00ff' } });
        return creep.pos.isNearTo(target);
    }

    private findUpgradeContainer(creep: Creep): StructureContainer | null {
        const ctrl = creep.room.controller;
        if (!ctrl) return null;
        const containers = creep.room.find(FIND_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_CONTAINER
        }) as StructureContainer[];
        return containers.find(c =>
            c.pos.getRangeTo(ctrl) <= 3 && c.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        ) ?? null;
    }
}
