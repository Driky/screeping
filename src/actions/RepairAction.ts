import { ActionBase } from "./ActionBase";
import { WorldState } from "../types/goap";

export class RepairAction extends ActionBase {
    name = "repair";
    preconditions: WorldState = { hasEnergy: true }; // On doit avoir de l'énergie
    effects: WorldState = { structureRepaired: true };

    public execute(creep: Creep): boolean {
        // On cherche la structure la plus abîmée (priorité aux containers et routes)
        const target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (s) => s.hits < s.hitsMax && s.structureType !== STRUCTURE_WALL
        });

        if (target) {
            const result = creep.repair(target);
            if (result === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: '#ff0000' } });
                return false;
            }
            // On s'arrête quand le creep est vide ou la structure réparée
            return creep.store[RESOURCE_ENERGY] === 0 || target.hits === target.hitsMax;
        }
        return true;
    }
}
