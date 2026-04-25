export class ColonyOS {
    private static readonly SURVEY_EXPIRY_TICKS = 1000;

    public static run(): void {
        this.ensureMemory();
        this.updateScoutQueue();
        this.updateExpansionQueue();
    }

    private static ensureMemory(): void {
        if (!Memory.colony) {
            Memory.colony = { spawnQueue: [], threatLevel: 0, surveyedRooms: {} };
        }
    }

    private static updateScoutQueue(): void {
        const colony = Memory.colony!;

        for (const roomName in Game.rooms) {
            const room = Game.rooms[roomName];
            if (!room.controller?.my) continue;

            const exits = Game.map.describeExits(roomName);
            const hasUnsurveyed = Object.values(exits).some(exitRoom =>
                !exitRoom ||
                !colony.surveyedRooms[exitRoom] ||
                Game.time - colony.surveyedRooms[exitRoom].lastSurveyTick > this.SURVEY_EXPIRY_TICKS
            );
            if (!hasUnsurveyed) continue;

            const scoutAlive = _.any(Game.creeps, c =>
                c.memory.role === 'scout' && c.memory.homeRoom === roomName
            );
            const scoutQueued = colony.spawnQueue.some(e =>
                e.role === 'scout' && e.homeRoom === roomName
            );

            if (!scoutAlive && !scoutQueued) {
                colony.spawnQueue.push({ role: 'scout', priority: 5, homeRoom: roomName });
            }
        }
    }

    private static updateExpansionQueue(): void {
        const colony = Memory.colony!;
        const expansionTarget = colony.expansionTarget;
        if (!expansionTarget) return;

        // Check if the target is already ours
        const targetRoom = Game.rooms[expansionTarget];
        if (targetRoom?.controller?.my) {
            console.log(`[Colony] ${expansionTarget} claimed — clearing expansion target`);
            colony.expansionTarget = undefined;
            return;
        }

        // Need a survey first
        const survey = colony.surveyedRooms[expansionTarget];
        if (!survey) {
            // Scout will pick it up via the exits mechanism; no action needed
            return;
        }

        // Don't expand into owned or hostile rooms
        if (survey.controllerOwner && survey.controllerOwner !== 'Invader') return;
        if (survey.hasHostiles) return;

        const claimerAlive = _.any(Game.creeps, c =>
            c.memory.role === 'claimer' && c.memory.targetRoom === expansionTarget
        );
        const claimerQueued = colony.spawnQueue.some(e =>
            e.role === 'claimer' && e.targetRoom === expansionTarget
        );

        if (!claimerAlive && !claimerQueued) {
            const homeRoom = this.closestOwnedRoom(expansionTarget);
            if (homeRoom) {
                colony.spawnQueue.push({
                    role: 'claimer',
                    priority: 1,
                    homeRoom,
                    targetRoom: expansionTarget,
                });
                console.log(`[Colony] Queued claimer from ${homeRoom} → ${expansionTarget}`);
            }
        }
    }

    private static closestOwnedRoom(targetRoom: string): string | null {
        let best: string | null = null;
        let bestDist = Infinity;
        for (const roomName in Game.rooms) {
            const room = Game.rooms[roomName];
            if (!room.controller?.my) continue;
            const dist = Game.map.getRoomLinearDistance(roomName, targetRoom);
            if (dist < bestDist) { bestDist = dist; best = roomName; }
        }
        return best;
    }
}
