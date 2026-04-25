export class ConstructionManager {
    private static readonly MAX_SITES_QUEUED = 5;

    public static run(room: Room): void {
        if (Game.time % 50 !== 0) return;
        if (!room.controller?.my) return;

        const rcl = room.controller.level;
        if (rcl < 2) return;

        const spawn = room.find(FIND_MY_SPAWNS)[0];
        if (!spawn) return;

        const currentSites = room.find(FIND_CONSTRUCTION_SITES);
        if (currentSites.length >= this.MAX_SITES_QUEUED) return;

        const budget = this.MAX_SITES_QUEUED - currentSites.length;
        this.placeForRCL(room, rcl, spawn, budget);
    }

    private static placeForRCL(room: Room, rcl: number, spawn: StructureSpawn, budget: number): void {
        let remaining = budget;

        // Place extensions first (cumulative across all RCL levels)
        const extensionTarget = this.extensionTargetForRCL(rcl);
        const existingExtensions = room.find(FIND_MY_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_EXTENSION
        }).length;
        const extensionSites = room.find(FIND_CONSTRUCTION_SITES, {
            filter: s => s.structureType === STRUCTURE_EXTENSION
        }).length;
        const extensionsNeeded = extensionTarget - existingExtensions - extensionSites;

        if (extensionsNeeded > 0 && remaining > 0) {
            const placed = this.placeExtensions(room, spawn, Math.min(extensionsNeeded, remaining));
            remaining -= placed;
        }

        if (remaining <= 0) return;

        // Containers adjacent to each source (one per source)
        const sources = room.find(FIND_SOURCES);
        for (const source of sources) {
            if (remaining <= 0) break;
            if (this.hasStructureOrSiteNear(room, source.pos, STRUCTURE_CONTAINER)) continue;
            const pos = this.findAdjacentOpen(room, source.pos);
            if (pos && this.createSite(room, pos, STRUCTURE_CONTAINER)) remaining--;
        }

        if (remaining <= 0) return;

        // Tower(s)
        const towerTarget = this.towerTargetForRCL(rcl);
        const existingTowers = room.find(FIND_MY_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_TOWER
        }).length;
        const towerSites = room.find(FIND_CONSTRUCTION_SITES, {
            filter: s => s.structureType === STRUCTURE_TOWER
        }).length;
        const towersNeeded = towerTarget - existingTowers - towerSites;

        if (towersNeeded > 0 && remaining > 0) {
            const pos = this.findOpenNearSpawn(room, spawn, 3, 6);
            if (pos && this.createSite(room, pos, STRUCTURE_TOWER)) remaining--;
        }

        if (remaining <= 0 || rcl < 4) return;

        // Storage (RCL 4+)
        if (!room.storage && !this.hasSiteOfType(room, STRUCTURE_STORAGE)) {
            const pos = this.findOpenNearSpawn(room, spawn, 2, 4);
            if (pos && this.createSite(room, pos, STRUCTURE_STORAGE)) remaining--;
        }

        if (remaining <= 0 || rcl < 6) return;

        // Terminal (RCL 6+)
        if (!room.terminal && !this.hasSiteOfType(room, STRUCTURE_TERMINAL)) {
            const pos = this.findOpenNearSpawn(room, spawn, 4, 8);
            if (pos && this.createSite(room, pos, STRUCTURE_TERMINAL)) remaining--;
        }
    }

    private static extensionTargetForRCL(rcl: number): number {
        const targets: { [k: number]: number } = { 1: 0, 2: 5, 3: 10, 4: 20, 5: 30, 6: 40, 7: 50, 8: 60 };
        return targets[rcl] ?? 0;
    }

    private static towerTargetForRCL(rcl: number): number {
        if (rcl >= 8) return 6;
        if (rcl >= 7) return 4;
        if (rcl >= 6) return 3;
        if (rcl >= 3) return 2;
        if (rcl >= 2) return 1;
        return 0;
    }

    private static placeExtensions(room: Room, spawn: StructureSpawn, count: number): number {
        let placed = 0;
        for (const pos of this.spiralPositions(spawn.pos, 2, 10)) {
            if (placed >= count) break;
            if (!this.isBuildable(room, pos)) continue;
            if (this.createSite(room, pos, STRUCTURE_EXTENSION)) placed++;
        }
        return placed;
    }

    private static *spiralPositions(center: RoomPosition, minRange: number, maxRange: number): Generator<RoomPosition> {
        const { x: cx, y: cy, roomName } = center;
        for (let r = minRange; r <= maxRange; r++) {
            for (let dx = -r; dx < r; dx++) {
                yield new RoomPosition(cx + dx, cy - r, roomName);
            }
            for (let dy = -r; dy < r; dy++) {
                yield new RoomPosition(cx + r, cy + dy, roomName);
            }
            for (let dx = r; dx > -r; dx--) {
                yield new RoomPosition(cx + dx, cy + r, roomName);
            }
            for (let dy = r; dy > -r; dy--) {
                yield new RoomPosition(cx - r, cy + dy, roomName);
            }
        }
    }

    private static findAdjacentOpen(room: Room, pos: RoomPosition): RoomPosition | null {
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                const candidate = new RoomPosition(pos.x + dx, pos.y + dy, room.name);
                if (this.isBuildable(room, candidate)) return candidate;
            }
        }
        return null;
    }

    private static findOpenNearSpawn(room: Room, spawn: StructureSpawn, minR: number, maxR: number): RoomPosition | null {
        for (const pos of this.spiralPositions(spawn.pos, minR, maxR)) {
            if (this.isBuildable(room, pos)) return pos;
        }
        return null;
    }

    private static isBuildable(room: Room, pos: RoomPosition): boolean {
        if (pos.x <= 0 || pos.x >= 49 || pos.y <= 0 || pos.y >= 49) return false;
        const terrain = room.getTerrain().get(pos.x, pos.y);
        if (terrain === TERRAIN_MASK_WALL) return false;
        const atPos = room.lookAt(pos);
        for (const item of atPos) {
            if (item.type === LOOK_STRUCTURES) return false;
            if (item.type === LOOK_CONSTRUCTION_SITES) return false;
        }
        return true;
    }

    private static hasStructureOrSiteNear(room: Room, pos: RoomPosition, type: StructureConstant): boolean {
        const structures = room.lookForAtArea(LOOK_STRUCTURES, pos.y - 1, pos.x - 1, pos.y + 1, pos.x + 1, true);
        if (structures.some(s => s.structure.structureType === type)) return true;
        const sites = room.lookForAtArea(LOOK_CONSTRUCTION_SITES, pos.y - 1, pos.x - 1, pos.y + 1, pos.x + 1, true);
        return sites.some(s => s.constructionSite.structureType === type);
    }

    private static hasSiteOfType(room: Room, type: StructureConstant): boolean {
        return room.find(FIND_CONSTRUCTION_SITES, { filter: s => s.structureType === type }).length > 0;
    }

    private static createSite(room: Room, pos: RoomPosition, type: BuildableStructureConstant): boolean {
        const result = room.createConstructionSite(pos, type);
        if (result === OK) {
            console.log(`[Construction] Placed ${type} at (${pos.x},${pos.y}) in ${room.name}`);
            return true;
        }
        if (result !== ERR_FULL && result !== ERR_RCL_NOT_ENOUGH) {
            console.log(`[Construction] Failed ${type} at (${pos.x},${pos.y}): code ${result}`);
        }
        return false;
    }
}
