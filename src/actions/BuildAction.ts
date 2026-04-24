import { ActionBase } from "./ActionBase";
import { WorldState } from "../types/goap";

export class BuildAction extends ActionBase {
    name = "build";
    preconditions: WorldState = { hasEnergy: true, nearConstruction: true };
    effects: WorldState = { buildTargetDone: true };

    execute(creep: Creep): boolean {
        const site = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
        if (site && creep.build(site) === OK) {
            return creep.store[RESOURCE_ENERGY] === 0;
        }
        return true;
    }
}
