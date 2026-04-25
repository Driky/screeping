import { ActionBase } from "./ActionBase";
import { WorldState } from "../types/goap";

export class WithdrawFromLinkAction extends ActionBase {
    name = "withdrawFromLink";
    roles = ['upgrader'];
    preconditions: WorldState = { nearLink: true, hasEnergy: false };
    effects: WorldState = { hasEnergy: true };

    public getCost(_creep: Creep): number { return 2; }

    public execute(creep: Creep): boolean {
        const link = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_LINK &&
                (s as StructureLink).store[RESOURCE_ENERGY] > 0
        }) as StructureLink | null;
        if (!link) { creep.memory.plan = []; return true; }
        const result = creep.withdraw(link, RESOURCE_ENERGY);
        return result === OK || creep.store.getFreeCapacity() === 0;
    }
}
