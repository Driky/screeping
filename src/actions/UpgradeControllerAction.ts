import { ActionBase } from "./ActionBase";
import { WorldState } from "../types/goap";

export class UpgradeControllerAction extends ActionBase {
    name = "upgradeController";
    // Nécessite d'être à côté du contrôleur ET d'avoir de l'énergie
    preconditions: WorldState = { nearController: true, hasEnergy: true };
    // L'effet final attendu par le rôle 'upgrader'
    effects: WorldState = { controllerUpgraded: true };

    public getCost(creep: Creep): number {
        return 1;
    }

    public execute(creep: Creep): boolean {
        const controller = creep.room.controller;

        if (controller) {
            const result = creep.upgradeController(controller);

            if (result === OK) {
                // L'action est terminée quand le creep n'a plus d'énergie
                return creep.store[RESOURCE_ENERGY] === 0;
            }

            if (result === ERR_NOT_IN_RANGE) {
                // Sécurité : si on n'est pas à portée, le plan a échoué
                return true;
            }
        }

        return true; // Terminé par défaut si le contrôleur n'existe pas
    }
}
