import { ActionBase } from "./ActionBase";
import { WorldState } from "../types/goap";

export class TransferToLinkAction extends ActionBase {
    name = "transferToLink";
    roles = ['hauler', 'miner'];
    preconditions: WorldState = { hasEnergy: true, nearLink: true };
    effects: WorldState = { targetFull: true };

    public getCost(_creep: Creep): number { return 1; }

    public execute(creep: Creep): boolean {
        const link = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_LINK &&
                (s as StructureLink).store.getFreeCapacity(RESOURCE_ENERGY) > 0
        }) as StructureLink | null;
        if (!link) { creep.memory.plan = []; return true; }
        const result = creep.transfer(link, RESOURCE_ENERGY);
        return result === OK || creep.store[RESOURCE_ENERGY] === 0;
    }
}
