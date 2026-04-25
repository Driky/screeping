import { ActionBase } from "./ActionBase";
import { WorldState } from "../types/goap";

export class MoveToLinkAction extends ActionBase {
    name = "moveToLink";
    roles = ['hauler', 'miner', 'upgrader'];
    preconditions: WorldState = { nearLink: false };
    effects: WorldState = { nearLink: true };

    public getCost(creep: Creep): number {
        const link = this.findLink(creep);
        return link ? creep.pos.getRangeTo(link) : 99;
    }

    public execute(creep: Creep): boolean {
        const link = this.findLink(creep);
        if (!link) { creep.memory.plan = []; return true; }
        creep.moveTo(link, { visualizePathStyle: { stroke: '#ffff00' } });
        return creep.pos.isNearTo(link);
    }

    private findLink(creep: Creep): StructureLink | null {
        return creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_LINK
        }) as StructureLink | null;
    }
}
