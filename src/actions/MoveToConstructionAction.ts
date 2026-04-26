import { ActionBase } from "./ActionBase";
import { WorldState } from "../types/goap";

export class MoveToConstructionAction extends ActionBase {
    name = "moveToConstruction";
    preconditions: WorldState = { nearConstruction: false, hasEnergy: true };
    effects: WorldState = { nearConstruction: true, nearDropped: false };

    public getCost(creep: Creep): number {
        const site = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
        return site ? creep.pos.getRangeTo(site) : 99;
    }

    public execute(creep: Creep): boolean {
        const site = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
        if (site) {
            creep.moveTo(site, { visualizePathStyle: { stroke: '#22ff22', lineStyle: 'dashed' } });
            return creep.pos.isNearTo(site);
        }
        return true;
    }
}
