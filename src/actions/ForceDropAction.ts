import { ActionBase } from "./ActionBase";
import { WorldState } from "../types/goap";

export class ForceDropAction extends ActionBase {
    name = "forceDrop";
    roles = ['hauler'];
    preconditions: WorldState = { hasEnergy: true, nearConstruction: true };
    effects: WorldState = { targetFull: true };

    public getCost(_creep: Creep): number {
        return 100; // last resort — only chosen when no deposit target is reachable
    }

    public execute(creep: Creep): boolean {
        creep.drop(RESOURCE_ENERGY);
        return true;
    }
}
