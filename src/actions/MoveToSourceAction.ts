import { ActionBase } from "./ActionBase";
import { WorldState } from "../types/goap";

export class MoveToSourceAction extends ActionBase {
    name = "moveToSource";
    preconditions: WorldState = { atSource: false };
    effects: WorldState = { atSource: true };

    private getSource(creep: Creep): Source | null {
        return creep.memory.sourceId
            ? Game.getObjectById(creep.memory.sourceId)
            : creep.pos.findClosestByRange(FIND_SOURCES);
    }

    getCost(creep: Creep): number {
        const source = this.getSource(creep);
        return source ? creep.pos.getRangeTo(source) : 99;
    }

    execute(creep: Creep): boolean {
        const source = this.getSource(creep);
        if (source) {
            creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
            return creep.pos.isNearTo(source);
        }
        return true;
    }
}
