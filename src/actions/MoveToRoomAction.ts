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

        const dest = new RoomPosition(25, 25, target);
        creep.moveTo(dest, { visualizePathStyle: { stroke: '#aaaaff' }, reusePath: 10 });
        return false;
    }
}
