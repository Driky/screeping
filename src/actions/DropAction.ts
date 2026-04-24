import { ActionBase } from "./ActionBase";
import { WorldState } from "../types/goap";

export class DropAction extends ActionBase {
    name = "drop";
    // Pré-condition : avoir de l'énergie et être à la source
    preconditions: WorldState = { hasEnergy: true, atSource: true };
    // Effet : on considère qu'on a "contribué" à l'énergie de la room (ou simplement vidé l'inventaire)
    effects: WorldState = { targetFull: true };

    public getCost(creep: Creep): number {
        // Cette action est très peu coûteuse si on n'a pas de Move parts
        return 1;
    }

    public execute(creep: Creep): boolean {
        // On jette l'énergie au sol (ou elle tombe dans le container s'il y en a un)
        creep.drop(RESOURCE_ENERGY);
        return true; // Immédiat
    }
}
