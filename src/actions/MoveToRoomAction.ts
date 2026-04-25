import { ActionBase } from "./ActionBase";
import { WorldState } from "../types/goap";

export class MoveToRoomAction extends ActionBase {
    name = "moveToRoom";
    roles = ['claimer', 'reserver', 'remoteMiner', 'remoteHauler', 'scout'];
    preconditions: WorldState = { inTargetRoom: false };
    effects: WorldState = { inTargetRoom: true };

    public getCost(creep: Creep): number {
        const target = creep.memory.targetRoom;
        if (!target) return 99;
        return Game.map.getRoomLinearDistance(creep.room.name, target) * 50;
    }

    public execute(creep: Creep): boolean {
        const target = creep.memory.targetRoom;
        if (!target) { creep.memory.plan = []; return true; }

        if (creep.room.name === target) return true;

        const exit = creep.room.findExitTo(target);
        if (exit === ERR_NO_PATH || exit === ERR_INVALID_ARGS) {
            creep.memory.plan = [];
            return true;
        }
        const exitPos = creep.pos.findClosestByRange(exit as FindConstant);
        if (exitPos) creep.moveTo(exitPos, { visualizePathStyle: { stroke: '#aaaaff' } });
        return false;
    }
}
