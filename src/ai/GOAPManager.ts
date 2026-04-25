import { IAction, WorldState } from "../types/goap";
import { GOAPPlanner } from "./GOAPPlanner";
import { WorldSensor } from "./WorldSensor";
import { creepSay } from "../utils/CreepSpeech";

export class GOAPManager {
    private planner: GOAPPlanner;
    private actions: IAction[];

    constructor(actions: IAction[]) {
        this.planner = new GOAPPlanner();
        this.actions = actions;
    }

    private executePlan(creep: Creep, currentState: WorldState): void {
        const currentIndex = creep.memory.currentActionIndex || 0;
        const plan = creep.memory.plan || [];

        if (currentIndex >= plan.length) {
            creep.memory.plan = [];
            return;
        }

        this.drawVisualPlan(creep, plan, currentIndex);

        const actionName = plan[currentIndex];
        const currentAction = this.actions.find(a => a.name === actionName);

        if (!currentAction) {
            creep.memory.plan = [];
            return;
        }

        // Guard: if world state diverged from what the plan assumed, replan
        if (!this.arePreconditionsMet(currentAction, currentState)) {
            if (Memory.debug && creep.memory.role === 'hauler') {
                for (const key in currentAction.preconditions) {
                    const k = key as keyof WorldState;
                    if (currentState[k] !== currentAction.preconditions[k]) {
                        console.log(`[GOAP] ${creep.name}: '${actionName}' failed on key='${key}' expected=${currentAction.preconditions[k]} got=${currentState[k]}`);
                    }
                }
            }
            creep.memory.plan = [];
            creep.memory.currentActionIndex = 0;
            delete creep.memory.nextPlanTick;
            return;
        }

        const isFinished = currentAction.execute(creep);
        creepSay(creep, currentAction.name);

        if (isFinished) {
            creep.memory.currentActionIndex = currentIndex + 1;
            if (creep.memory.currentActionIndex >= plan.length) {
                creep.memory.plan = [];
                creep.memory.currentActionIndex = 0;
            }
        }
    }

    private arePreconditionsMet(action: IAction, state: WorldState): boolean {
        for (const key in action.preconditions) {
            if (state[key as keyof WorldState] !== action.preconditions[key as keyof WorldState]) {
                return false;
            }
        }
        return true;
    }

    public run(creep: Creep, sources: Source[], sites: ConstructionSite[], depositTargets: AnyStoreStructure[], containers: StructureContainer[], dropped: Resource[], repairTargets: Structure[]): void {
        if (Game.cpu.bucket < 500 && Game.cpu.getUsed() > Game.cpu.limit * 0.8) return;

        // Compute current state every tick (needed for precondition validation and replanning)
        const currentState = WorldSensor.getCurrentState(creep, sources, sites, depositTargets, containers, dropped);

        // 1. Vérifier si on a déjà un plan en cours
        if (creep.memory.plan && creep.memory.plan.length > 0) {
            this.executePlan(creep, currentState);
            return;
        }

        // 2. Gestion du Cooldown de planification
        if (creep.memory.nextPlanTick && Game.time < creep.memory.nextPlanTick) {
            return;
        }

        // 3. Tentative de planification
        const goals = this.getGoalsByRole(creep, depositTargets, containers, sites, repairTargets);

        const role = creep.memory.role;
        const availableActions = this.actions.filter(a => !a.roles || a.roles.includes(role));

        let plan: IAction[] | null = null;
        for (const goal of goals) {
            plan = this.planner.buildPlan(creep, availableActions, currentState, goal);
            if (plan && plan.length > 0) break;
        }

        if (plan && plan.length > 0) {
            if (Memory.debug && creep.memory.role === 'hauler') {
                console.log(`[GOAP] ${creep.name} new plan: [${plan.map(a => a.name).join(' -> ')}]`);
            }
            creep.memory.plan = plan.map(a => a.name);
            creep.memory.currentActionIndex = 0;
            delete creep.memory.nextPlanTick; // On efface le cooldown si succès
        } else {
            // ÉCHEC : On attend 10 ticks avant de stresser le CPU à nouveau
            creep.memory.nextPlanTick = Game.time + 10;
            creepSay(creep, '💤 NoPath');
        }
    }

    private getGoalsByRole(creep: Creep, _depositTargets: AnyStoreStructure[], _containers: StructureContainer[], sites: ConstructionSite[], repairTargets: Structure[]): WorldState[] {
        switch (creep.memory.role) {
            case 'harvester':
            case 'miner':
            case 'hauler':
                return [{ targetFull: true }];

            case 'upgrader':
                return [{ controllerUpgraded: true }];

            case 'repairer':
                return [{ structureRepaired: true }];

            case 'defender':
                return [{ enemyDead: true }];

            case 'claimer':
                return [{ controllerClaimed: true }];

            case 'reserver':
                return [{ controllerReserved: true }];

            case 'remoteMiner':
                return [{ hasEnergy: true }];

            case 'remoteHauler':
                return [{ targetFull: true }];

            case 'builder': {
                const goals: WorldState[] = [];
                if (sites.length > 0) goals.push({ buildTargetDone: true });
                if (repairTargets.length > 0) goals.push({ structureRepaired: true });
                goals.push({ targetFull: true });
                return goals;
            }

            default:
                return [{}];
        }
    }

    private drawVisualPlan(creep: Creep, plan: string[], index: number): void {
        const remainingActions = plan.slice(index).join(" -> ");
        creep.room.visual.text(
            `📋 ${remainingActions}`,
            creep.pos.x,
            creep.pos.y - 1,
            { align: 'center', strokeWidth: 0.5, opacity: 0.7, color: '#ffffff', font: 'Courier New' }
        );

        // On dessine aussi une ligne vers la destination de l'action en cours
        // (Optionnel, utile si vous avez les positions en mémoire)
    }
}
