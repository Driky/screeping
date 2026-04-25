import { ActionBase } from "./ActionBase";
import { WorldState } from "../types/goap";

// Returns a remoteHauler to its home room to deposit energy.
// Precondition: inTargetRoom: false means "not in home room" for haulers
// (home room is NOT the target room — target room is the foreign room).
// We repurpose inTargetRoom: false to mean "not yet back home" is complex,
// so instead this action uses atTarget: false + hasEnergy: true as trigger.
export class MoveToHomeRoomAction extends ActionBase {
    name = "moveToHomeRoom";
    roles = ['remoteHauler'];
    preconditions: WorldState = { hasEnergy: true, atTarget: false };
    effects: WorldState = { atTarget: true };

    public getCost(creep: Creep): number {
        const homeRoom = creep.memory.homeRoom;
        if (!homeRoom) return 99;
        if (creep.room.name === homeRoom) return 1;
        return Game.map.getRoomLinearDistance(creep.room.name, homeRoom) * 50 + 10;
    }

    public execute(creep: Creep): boolean {
        const homeRoom = creep.memory.homeRoom;
        if (!homeRoom) { creep.memory.plan = []; return true; }

        // If already in home room, find deposit target
        if (creep.room.name === homeRoom) {
            const target = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                filter: s =>
                    (s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION) &&
                    (s as AnyStoreStructure).store.getFreeCapacity(RESOURCE_ENERGY) > 0
            });
            return target ? creep.pos.isNearTo(target) : true;
        }

        // Navigate home
        const exit = creep.room.findExitTo(homeRoom);
        if (exit === ERR_NO_PATH || exit === ERR_INVALID_ARGS) {
            creep.memory.plan = [];
            return true;
        }
        const exitPos = creep.pos.findClosestByRange(exit as FindConstant);
        if (exitPos) creep.moveTo(exitPos, { visualizePathStyle: { stroke: '#00ff88' } });
        return false;
    }
}
