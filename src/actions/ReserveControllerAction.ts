import { ActionBase } from "./ActionBase";
import { WorldState } from "../types/goap";

export class ReserveControllerAction extends ActionBase {
    name = "reserveController";
    roles = ['reserver'];
    preconditions: WorldState = { inTargetRoom: true, nearController: true };
    effects: WorldState = { controllerReserved: true };

    public getCost(_creep: Creep): number { return 1; }

    public execute(creep: Creep): boolean {
        const controller = creep.room.controller;
        if (!controller) { creep.memory.plan = []; return true; }
        const result = creep.reserveController(controller);
        if (result === OK) return false; // Keep reserving each tick until done/dead
        if (result === ERR_NOT_IN_RANGE) creep.moveTo(controller);
        return false;
    }
}
