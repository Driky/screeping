import { ActionBase } from "./ActionBase";
import { WorldState } from "../types/goap";

export class UpgradeAction extends ActionBase {
    name = "upgrade";
    preconditions: WorldState = { hasEnergy: true, nearController: true };
    effects: WorldState = { targetFull: true };

    execute(creep: Creep): boolean {
        if (creep.room.controller) {
            const result = creep.upgradeController(creep.room.controller);
            if (result === OK) {
                // L'action est "finie" quand le creep est vide
                return creep.store[RESOURCE_ENERGY] === 0;
            }
        }
        return true;
    }
}
