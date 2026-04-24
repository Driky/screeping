import { ActionBase } from "./ActionBase";
import { WorldState } from "../types/goap";

export class MoveToSourceAction extends ActionBase {
    name = "moveToSource";
    preconditions: WorldState = { atSource: false };
    effects: WorldState = { atSource: true };

    getCost(creep: Creep): number {
        const source = creep.pos.findClosestByRange(FIND_SOURCES);
        return source ? creep.pos.getRangeTo(source) : 99;
    }

    execute(creep: Creep): boolean {
        const source = creep.pos.findClosestByRange(FIND_SOURCES);
        if (source) {
            creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
            return creep.pos.isNearTo(source);
        }
        return true;
    }
}
