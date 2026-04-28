import { ActionBase } from "./ActionBase";
import { WorldState } from "../types/goap";

export class MoveToStorageAction extends ActionBase {
    name = "moveToStorage";
    roles = ['builder', 'upgrader', 'repairer', 'hauler'];
    preconditions: WorldState = { storageHasEnergy: true, nearStorage: false, hasEnergy: false };
    effects: WorldState = { nearStorage: true };

    public getCost(creep: Creep): number {
        const storage = creep.room.storage;
        return storage ? creep.pos.getRangeTo(storage) : 99;
    }

    public execute(creep: Creep): boolean {
        const storage = creep.room.storage;
        if (!storage) { creep.memory.plan = []; return true; }
        creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffaa00' } });
        return creep.pos.isNearTo(storage);
    }
}
