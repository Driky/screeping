import { ActionBase } from "./ActionBase";
import { WorldState } from "../types/goap";

// Moves remoteMiner to its assigned source once in the target room.
export class MoveToRemoteSourceAction extends ActionBase {
    name = "moveToRemoteSource";
    roles = ['remoteMiner'];
    preconditions: WorldState = { inTargetRoom: true, atSource: false, hasEnergy: false };
    effects: WorldState = { atSource: true };

    public getCost(creep: Creep): number {
        const source = creep.memory.sourceId ? Game.getObjectById(creep.memory.sourceId) : null;
        return source ? creep.pos.getRangeTo(source) : 50;
    }

    public execute(creep: Creep): boolean {
        const source = creep.memory.sourceId ? Game.getObjectById(creep.memory.sourceId) : null;
        if (!source) { creep.memory.plan = []; return true; }
        creep.moveTo(source, { visualizePathStyle: { stroke: '#ffff00' } });
        return creep.pos.isNearTo(source);
    }
}
