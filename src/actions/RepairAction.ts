import { ActionBase } from "./ActionBase";
import { WorldState } from "../types/goap";

export class RepairAction extends ActionBase {
    name = "repair";
    roles = ['repairer', 'builder'];
    preconditions: WorldState = { hasEnergy: true };
    effects: WorldState = { structureRepaired: true };

    private static readonly REPAIR_TIERS = [100, 1_000, 100_000, 1_000_000];
    private static readonly WALL_LIKE = new Set<string>([STRUCTURE_WALL, STRUCTURE_RAMPART]);

    private getTier(hits: number): number {
        const idx = RepairAction.REPAIR_TIERS.findIndex(t => hits < t);
        return idx === -1 ? RepairAction.REPAIR_TIERS.length : idx;
    }

    private findRepairTarget(creep: Creep): Structure | null {
        const candidates = creep.room.find(FIND_STRUCTURES, {
            filter: s => s.hits < s.hitsMax &&
                (!RepairAction.WALL_LIKE.has(s.structureType) || s.hits < 1_000_000)
        });
        if (!candidates.length) return null;

        return candidates.sort((a, b) => {
            const td = this.getTier(a.hits) - this.getTier(b.hits);
            return td !== 0 ? td : a.hits - b.hits;
        })[0];
    }

    public getCost(creep: Creep): number {
        const t = this.findRepairTarget(creep);
        return t ? creep.pos.getRangeTo(t) : 99;
    }

    public execute(creep: Creep): boolean {
        let target: Structure | null = null;

        if (creep.memory.repairTargetId) {
            target = Game.getObjectById(creep.memory.repairTargetId) as Structure | null;
            if (!target || target.hits === target.hitsMax) {
                delete creep.memory.repairTargetId;
                target = null;
            }
        }

        if (!target) {
            target = this.findRepairTarget(creep);
            if (target) creep.memory.repairTargetId = target.id as Id<Structure>;
        }

        if (!target) return true;

        const result = creep.repair(target);
        if (result === ERR_NOT_IN_RANGE) {
            creep.moveTo(target, { visualizePathStyle: { stroke: '#ff0000' } });
            return false;
        }

        if (creep.store[RESOURCE_ENERGY] === 0) {
            delete creep.memory.repairTargetId;
            return true;
        }

        if (target.hits === target.hitsMax) {
            delete creep.memory.repairTargetId;
            return true;
        }

        return false;
    }
}
