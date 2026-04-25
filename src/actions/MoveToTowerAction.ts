import { ActionBase } from "./ActionBase";
import { WorldState } from "../types/goap";

export class MoveToTowerAction extends ActionBase {
    name = "moveToTower";
    roles = ['hauler'];
    preconditions: WorldState = { nearTower: false };
    effects: WorldState = { nearTower: true };

    public getCost(creep: Creep): number {
        const tower = this.findTower(creep);
        return tower ? creep.pos.getRangeTo(tower) : 99;
    }

    public execute(creep: Creep): boolean {
        const tower = this.findTower(creep);
        if (!tower) { creep.memory.plan = []; return true; }
        creep.moveTo(tower, { visualizePathStyle: { stroke: '#ff4400' } });
        return creep.pos.isNearTo(tower);
    }

    private findTower(creep: Creep): StructureTower | null {
        return creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_TOWER &&
                (s as StructureTower).store.getFreeCapacity(RESOURCE_ENERGY) > 0
        }) as StructureTower | null;
    }
}
