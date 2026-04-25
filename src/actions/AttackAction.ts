import { ActionBase } from "./ActionBase";
import { WorldState } from "../types/goap";

export class AttackAction extends ActionBase {
    name = "attack";
    roles = ['defender'];
    preconditions: WorldState = { nearEnemy: true };
    effects: WorldState = { enemyDead: true };

    public getCost(_creep: Creep): number { return 1; }

    public execute(creep: Creep): boolean {
        const enemy = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if (!enemy) return true;
        const result = creep.attack(enemy);
        // Stay in attack loop until no enemies remain
        return result !== OK;
    }
}
