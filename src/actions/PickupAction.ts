import { ActionBase } from "./ActionBase";
import { WorldState } from "../types/goap";

export class PickupAction extends ActionBase {
    name = "pickup";
    preconditions: WorldState = { nearContainer: true, hasEnergy: false };
    effects: WorldState = { hasEnergy: true };

    public getCost(creep: Creep): number {
        const dropped = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
            filter: r => r.resourceType === RESOURCE_ENERGY
        });

        if (dropped) {
            // Plus il y a d'énergie au sol, plus le coût est BAS (attrayant)
            // On réduit le coût proportionnellement à la quantité
            const amountBonus = Math.min(dropped.amount / 100, 5);
            return 1 - amountBonus;
        }
        return 5; // Coût élevé s'il n'y a rien d'intéressant au sol
    }

    public execute(creep: Creep): boolean {
        const dropped = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
            filter: r => r.resourceType === RESOURCE_ENERGY
        });

        if (dropped) {
            const result = creep.pickup(dropped);
            return result === OK || creep.store.getFreeCapacity() === 0;
        }
        return true;
    }
}
