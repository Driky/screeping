import { ActionBase } from "./ActionBase";
import { WorldState } from "../types/goap";

export class TransferToStorageAction extends ActionBase {
    name = "transferToStorage";
    roles = ['hauler'];
    preconditions: WorldState = { hasEnergy: true, nearStorage: true };
    effects: WorldState = { targetFull: true };

    public getCost(_creep: Creep): number { return 1; }

    public execute(creep: Creep): boolean {
        const storage = creep.room.storage;
        if (!storage) { creep.memory.plan = []; return true; }
        const result = creep.transfer(storage, RESOURCE_ENERGY);
        return result === OK || creep.store[RESOURCE_ENERGY] === 0;
    }
}
