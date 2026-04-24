import { WorldState } from "types/goap";

export class WorldSensor {
    /**
     * Analyse le creep et son environnement pour générer l'état actuel
     */
    public static getCurrentState(creep: Creep): WorldState {
        const state: WorldState = {};

        // 1. État des ressources
        state.hasEnergy = creep.store[RESOURCE_ENERGY] > 0;

        // 2. Proximité de la Source d'énergie
        const closestSource = creep.pos.findClosestByRange(FIND_SOURCES);
        state.atSource = closestSource ? creep.pos.isNearTo(closestSource) : false;

        // 3. Proximité du Controller
        if (creep.room.controller) {
            state.nearController = creep.pos.isNearTo(creep.room.controller);
        } else {
            state.nearController = false;
        }

        // 4. L'objectif final (est-on en train de remplir la cible ?)
        // Par défaut au début d'un cycle, c'est faux
        state.targetFull = false;

        return state;
    }
}
