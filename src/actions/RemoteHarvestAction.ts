import { ActionBase } from "./ActionBase";
import { WorldState } from "../types/goap";

// Like HarvestAction but for creeps assigned to a foreign source.
// Works because Game.getObjectById resolves once the creep has vision.
export class RemoteHarvestAction extends ActionBase {
    name = "remoteHarvest";
    roles = ['remoteMiner'];
    preconditions: WorldState = { inTargetRoom: true, atSource: true, hasEnergy: false };
    effects: WorldState = { hasEnergy: true };

    public getCost(_creep: Creep): number { return 1; }

    public execute(creep: Creep): boolean {
        const source = creep.memory.sourceId ? Game.getObjectById(creep.memory.sourceId) : null;
        if (!source) { creep.memory.plan = []; return true; }
        creep.harvest(source);
        return creep.store.getFreeCapacity() === 0;
    }
}
