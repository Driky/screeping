import { ActionBase } from "./ActionBase";
import { WorldState } from "../types/goap";
import { log } from "../utils/Logger";

export class ClaimControllerAction extends ActionBase {
    name = "claimController";
    roles = ['claimer'];
    preconditions: WorldState = { inTargetRoom: true, nearController: true };
    effects: WorldState = { controllerClaimed: true };

    public getCost(_creep: Creep): number { return 1; }

    public execute(creep: Creep): boolean {
        const controller = creep.room.controller;
        if (!controller) { creep.memory.plan = []; return true; }
        const result = creep.claimController(controller);
        if (result === OK) return true;
        if (result === ERR_NOT_IN_RANGE) {
            creep.moveTo(controller);
        } else {
            log('manager', `${creep.name}: claimController failed code=${result}`, 'warn', creep.memory.role);
        }
        return false;
    }
}
