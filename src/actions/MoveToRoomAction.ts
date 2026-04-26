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

        if (creep.room.name === target) {
            const p = creep.pos;
            // Border tile — keep moving inward so creep doesn't slip back on a tick with no movement
            if (p.x === 0 || p.x === 49 || p.y === 0 || p.y === 49) {
                creep.moveTo(new RoomPosition(25, 25, target), { reusePath: 10 });
                return false;
            }
            return true;
        }

        creep.moveTo(new RoomPosition(25, 25, target), { visualizePathStyle: { stroke: '#aaaaff' }, reusePath: 10 });
        return false;
    }
}
