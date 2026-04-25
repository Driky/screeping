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
        const exit = creep.room.findExitTo(targetRoom);
        if (exit === ERR_NO_PATH || exit === ERR_INVALID_ARGS) {
            console.log(`[Scout] ${creep.name}: no path to ${targetRoom}`);
            delete creep.memory.targetRoom;
            return;
        }
        const exitPos = creep.pos.findClosestByRange(exit as FindConstant);
        if (exitPos) creep.moveTo(exitPos, { visualizePathStyle: { stroke: '#aaaaff' } });
    }

    private static pickTarget(creep: Creep): string | null {
        const surveyed = Memory.colony!.surveyedRooms;
        const exits = Game.map.describeExits(creep.room.name);
        for (const dir in exits) {
            const roomName = exits[dir as unknown as ExitKey];
            if (!roomName) continue;
            const survey = surveyed[roomName];
            if (!survey || Game.time - survey.lastSurveyTick > this.SURVEY_EXPIRY_TICKS) {
                return roomName;
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

        console.log(
            `[Scout] Surveyed ${room.name}: ` +
            `sources=${sources.length} ` +
            `owner=${controller?.owner?.username ?? 'none'} ` +
            `reserved=${controller?.reservation?.username ?? 'none'} ` +
            `hostiles=${hostiles.length}`
        );
    }
}
