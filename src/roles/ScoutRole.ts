import { log } from "../utils/Logger";

export class ScoutRole {
    private static readonly SURVEY_EXPIRY_TICKS = 1000;

    public static run(creep: Creep): void {
        if (!Memory.colony) {
            Memory.colony = { spawnQueue: [], threatLevel: 0, surveyedRooms: {} };
        }

        // Survey current room if it's the designated target
        if (creep.memory.targetRoom && creep.room.name === creep.memory.targetRoom) {
            this.surveyRoom(creep.room);
            delete creep.memory.targetRoom;
            return;
        }

        // Pick next room to scout if we don't have a target
        if (!creep.memory.targetRoom) {
            const target = this.pickTarget(creep);
            if (!target) return; // All exits recently surveyed
            creep.memory.targetRoom = target;
        }

        // Move toward target room
        this.moveToward(creep, creep.memory.targetRoom);
    }

    private static moveToward(creep: Creep, targetRoom: string): void {
        const dest = new RoomPosition(25, 25, targetRoom);
        creep.moveTo(dest, { visualizePathStyle: { stroke: '#aaaaff' }, reusePath: 10 });
    }

    private static pickTarget(creep: Creep): string | null {
        if (!Memory.colony) return null;
        const surveyed = Memory.colony.surveyedRooms;
        const homeRoom = creep.memory.homeRoom ?? creep.room.name;
        const MAX_RANGE = 3;

        // BFS from homeRoom — find nearest unsurveyed room within MAX_RANGE hops.
        // This lets the scout discover rooms 2+ hops away (e.g. E49N56 via E49N55).
        const visited = new Set<string>([homeRoom]);
        const queue: Array<{ room: string; dist: number }> = [{ room: homeRoom, dist: 0 }];

        while (queue.length > 0) {
            const { room: current, dist } = queue.shift()!;
            if (dist >= MAX_RANGE) continue;
            const exits = Game.map.describeExits(current);
            for (const dir in exits) {
                const roomName = exits[dir as unknown as ExitKey];
                if (!roomName || visited.has(roomName)) continue;
                visited.add(roomName);
                const survey = surveyed[roomName];
                if (!survey || Game.time - survey.lastSurveyTick > this.SURVEY_EXPIRY_TICKS) {
                    return roomName;
                }
                queue.push({ room: roomName, dist: dist + 1 });
            }
        }
        return null;
    }

    private static surveyRoom(room: Room): void {
        const sources = room.find(FIND_SOURCES);
        const controller = room.controller;
        const hostiles = room.find(FIND_HOSTILE_CREEPS);

        Memory.colony!.surveyedRooms[room.name] = {
            sources: sources.length,
            controllerLevel: controller?.level ?? 0,
            controllerOwner: controller?.owner?.username,
            reservation: controller?.reservation?.username,
            hasHostiles: hostiles.length > 0,
            lastSurveyTick: Game.time,
        };

        log('scout',
            `Surveyed ${room.name}: ` +
            `sources=${sources.length} ` +
            `owner=${controller?.owner?.username ?? 'none'} ` +
            `reserved=${controller?.reservation?.username ?? 'none'} ` +
            `hostiles=${hostiles.length}`
        );
    }
}
