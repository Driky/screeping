import { ActionBase } from "./ActionBase";
import { WorldState } from "../types/goap";

export class TransferAction extends ActionBase {
    name = "transfer";
    preconditions: WorldState = { hasEnergy: true, atTarget: true };
    effects: WorldState = { targetFull: true };

    execute(creep: Creep): boolean {
        // 1. On cherche les structures qui ont besoin d'énergie
        const target = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
            filter: (s) => {
                return (s.structureType === STRUCTURE_SPAWN ||
                        s.structureType === STRUCTURE_EXTENSION) &&
                        // On vérifie que la structure a bien un store avant d'y accéder
                        (s as AnyStoreStructure).store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            }
        });

        if (target) {
            const storeTarget = target as AnyStoreStructure;
            const result = creep.transfer(storeTarget, RESOURCE_ENERGY);

            if (result === OK) {
                // L'action est finie si le creep est vide ou si la structure est pleine
                return creep.store[RESOURCE_ENERGY] === 0 ||
                       storeTarget.store.getFreeCapacity(RESOURCE_ENERGY) === 0;
            }
        }

        return true; // On arrête l'action en cas d'erreur ou si aucune cible n'est trouvée
    }
}
