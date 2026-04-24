import { IAction, WorldState } from "../types/goap";
import { GOAPPlanner } from "./GOAPPlanner";
import { WorldSensor } from "./WorldSensor";

export class GOAPManager {
    private planner: GOAPPlanner;
    private actions: IAction[];

    constructor(actions: IAction[]) {
        this.planner = new GOAPPlanner();
        this.actions = actions;
    }

    public run(creep: Creep): void {
        const currentState = WorldSensor.getCurrentState(creep);
        let goalState: WorldState = {};

        switch (creep.memory.role) {
            case 'harvester':
                goalState = { targetFull: true };
                break;
            case 'upgrader':
                goalState = { controllerUpgraded: true };
                break;
            case 'builder':
                // S'il n'y a rien à construire, le builder devient un harvester par défaut
                const sites = creep.room.find(FIND_CONSTRUCTION_SITES);
                goalState = sites.length > 0 ? { buildTargetDone: true } : { targetFull: true };
                break;
        }

        // 1. Planification si nécessaire
        if (!creep.memory.plan || creep.memory.plan.length === 0) {
            const plan = this.planner.buildPlan(creep, this.actions, currentState, goalState);
            if (plan && plan.length > 0) {
                creep.memory.plan = plan.map(a => a.name);
                creep.memory.currentActionIndex = 0;
                creep.say('Planning...');
            } else {
                creep.say('No Plan!');
                return;
            }
        }

        // 2. Exécution
        const actionName = creep.memory.plan[creep.memory.currentActionIndex || 0];
        const currentAction = this.actions.find(a => a.name === actionName);

        if (currentAction) {
            const isFinished = currentAction.execute(creep);
            if (isFinished) {
                creep.memory.currentActionIndex!++;

                // Si le plan est fini
                if (creep.memory.currentActionIndex! >= creep.memory.plan.length) {
                    creep.memory.plan = [];
                    creep.memory.currentActionIndex = 0;
                }
            }
        } else {
            // Sécurité : si l'action n'existe pas, on reset
            creep.memory.plan = [];
        }
    }
}
