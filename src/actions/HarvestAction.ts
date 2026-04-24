import { ActionBase } from "./ActionBase";
import { WorldState } from "../types/goap";

export class HarvestAction extends ActionBase {
    name = "harvest";
    roles = ['miner', 'harvester'];
    // On doit être à la source. On ne met plus "hasEnergy: false" pour
    // permettre de continuer à récolter même si on a un peu d'énergie.
    preconditions: WorldState = { atSource: true };
    effects: WorldState = { hasEnergy: true };

    public getCost(creep: Creep): number { return 10; }

    public execute(creep: Creep): boolean {
        const source = creep.pos.findClosestByRange(FIND_SOURCES);
        if (source) {
            const result = creep.harvest(source);

            if (result === OK) {
                // L'action est "finie" quand le creep est plein.
                // Pour un mineur statique, il passera alors à l'action "Drop".
                return creep.store.getFreeCapacity() === 0;
            }
        }
        return true;
    }
}
