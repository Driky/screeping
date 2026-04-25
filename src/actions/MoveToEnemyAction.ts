import { ActionBase } from "./ActionBase";
import { WorldState } from "../types/goap";

export class MoveToEnemyAction extends ActionBase {
    name = "moveToEnemy";
    roles = ['defender'];
    preconditions: WorldState = { nearEnemy: false };
    effects: WorldState = { nearEnemy: true };

    public getCost(creep: Creep): number {
        const enemy = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        return enemy ? creep.pos.getRangeTo(enemy) : 99;
    }

    public execute(creep: Creep): boolean {
        const enemy = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if (!enemy) { creep.memory.plan = []; return true; }
        creep.moveTo(enemy, { visualizePathStyle: { stroke: '#ff0000' } });
        return creep.pos.isNearTo(enemy);
    }
}
