import { ActionBase } from "./ActionBase";
import { WorldState } from "../types/goap";

export class WithdrawFromStorageAction extends ActionBase {
    name = "withdrawFromStorage";
    roles = ['builder', 'upgrader', 'repairer'];
    preconditions: WorldState = { storageHasEnergy: true, nearStorage: true, hasEnergy: false };
    effects: WorldState = { hasEnergy: true };

    public getCost(_creep: Creep): number { return 2; }

    public execute(creep: Creep): boolean {
        const storage = creep.room.storage;
        if (!storage || storage.store[RESOURCE_ENERGY] === 0) return true;
        const result = creep.withdraw(storage, RESOURCE_ENERGY);
        return result === OK || creep.store.getFreeCapacity() === 0;
    }
}
