import { ActionBase } from "./ActionBase";
import { WorldState } from "../types/goap";

// Moves claimer/reserver to the controller in the target room.
// Does NOT require hasEnergy — differs from MoveToControllerAction (upgrader flow).
export class MoveToForeignControllerAction extends ActionBase {
    name = "moveToForeignController";
    roles = ['claimer', 'reserver'];
    preconditions: WorldState = { inTargetRoom: true, nearController: false };
    effects: WorldState = { nearController: true };

    public getCost(creep: Creep): number {
        return creep.room.controller ? creep.pos.getRangeTo(creep.room.controller) : 99;
    }

    public execute(creep: Creep): boolean {
        const controller = creep.room.controller;
        if (!controller) { creep.memory.plan = []; return true; }
        creep.moveTo(controller, { visualizePathStyle: { stroke: '#ff00ff' } });
        return creep.pos.isNearTo(controller);
    }
}
