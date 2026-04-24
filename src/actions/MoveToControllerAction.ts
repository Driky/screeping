import { ActionBase } from "./ActionBase";
import { WorldState } from "../types/goap";

export class MoveToControllerAction extends ActionBase {
    name = "moveToController";
    preconditions: WorldState = { nearController: false };
    effects: WorldState = { nearController: true };

    getCost(creep: Creep): number {
        return creep.room.controller ? creep.pos.getRangeTo(creep.room.controller) : 99;
    }

    execute(creep: Creep): boolean {
        const controller = creep.room.controller;
        if (controller) {
            creep.moveTo(controller, { visualizePathStyle: { stroke: '#ffffff' } });
            return creep.pos.isNearTo(controller);
        }
        return true;
    }
}
