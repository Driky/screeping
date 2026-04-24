import { ActionBase } from "./ActionBase";
import { WorldState } from "../types/goap";

export class HarvestAction extends ActionBase {
    name = "harvest";
    preconditions: WorldState = { atSource: true, };
    effects: WorldState = { hasEnergy: true };

    execute(creep: Creep): boolean {
        const source = creep.pos.findClosestByRange(FIND_SOURCES);
        if (source) {
            const result = creep.harvest(source);
            if (result === OK) {
                return creep.store.getFreeCapacity() === 0;
            }
        }
        return true; // Terminé si erreur ou source vide
    }
}
