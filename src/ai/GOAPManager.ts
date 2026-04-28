import { IAction, WorldState } from "../types/goap";
import { GOAPPlanner } from "./GOAPPlanner";
import { WorldSensor } from "./WorldSensor";
import { creepSay } from "../utils/CreepSpeech";
import { log } from "../utils/Logger";
import { measure, recordCreep, recordCooldownSkip } from "../utils/Profiler";

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
            if (this.effectAlreadyAchieved(currentAction, currentState)) {
                log('manager', `${creep.name}: '${actionName}' effects already achieved — advancing`, 'debug', creep.memory.role);
                // Action achieved its effect before executor called it — advance cleanly
                creep.memory.currentActionIndex = currentIndex + 1;
                if (creep.memory.currentActionIndex >= plan.length) {
                    creep.memory.plan = [];
                    creep.memory.currentActionIndex = 0;
                }
                return;
            }
            for (const key in currentAction.preconditions) {
                const k = key as keyof WorldState;
                if (currentState[k] !== currentAction.preconditions[k]) {
                    log('manager', `${creep.name}: '${actionName}' failed on key='${key}' expected=${currentAction.preconditions[k]} got=${currentState[k]}`, 'debug', creep.memory.role);
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

    private effectAlreadyAchieved(action: IAction, state: WorldState): boolean {
        for (const key in action.preconditions) {
            const k = key as keyof WorldState;
            if (state[k] !== action.preconditions[k]) {
                if (action.effects[k] !== state[k]) return false;
            }
        }
        return true;
    }

    public run(creep: Creep, sources: Source[], sites: ConstructionSite[], depositTargets: AnyStoreStructure[], containers: StructureContainer[], dropped: Resource[], repairTargets: Structure[]): void {
        if (Game.cpu.bucket < 500 && Game.cpu.getUsed() > Game.cpu.limit * 0.8) return;

        const _cpuStart = Game.cpu.getUsed();

        // Compute current state every tick (needed for precondition validation and replanning)
        const currentState = measure('world-sensor', () =>
            WorldSensor.getCurrentState(creep, sources, sites, depositTargets, containers, dropped)
        );

        // 1. Vérifier si on a déjà un plan en cours
        if (creep.memory.plan && creep.memory.plan.length > 0) {
            measure('goap-exec', () => this.executePlan(creep, currentState));
            recordCreep(creep.name, creep.memory.role, Game.cpu.getUsed() - _cpuStart, 'exec');
            return;
        }

        // 2. Gestion du Cooldown de planification
        if (creep.memory.nextPlanTick && Game.time < creep.memory.nextPlanTick) {
            recordCooldownSkip();
            recordCreep(creep.name, creep.memory.role, Game.cpu.getUsed() - _cpuStart, 'cooldown');
            return;
        }

        // 3. Tentative de planification
        const goals = this.getGoalsByRole(creep, depositTargets, containers, sites, repairTargets);

        const role = creep.memory.role;
        const availableActions = this.actions.filter(a => !a.roles || a.roles.includes(role));

        const plan: IAction[] | null = measure('goap-plan', () => {
            for (const goal of goals) {
                const p = this.planner.buildPlan(creep, availableActions, currentState, goal);
                if (p && p.length > 0) return p;
            }
            return null;
        });

        if (plan && plan.length > 0) {
            log('manager', `${creep.name} new plan: [${plan.map(a => a.name).join(' -> ')}]`, 'info', creep.memory.role);
            creep.memory.plan = plan.map(a => a.name);
            creep.memory.currentActionIndex = 0;
            delete creep.memory.nextPlanTick;
            measure('goap-exec', () => this.executePlan(creep, currentState)); // Execute immediately — avoids idle tick with no moveTo
        } else {
            // ÉCHEC : On attend 10 ticks avant de stresser le CPU à nouveau
            creep.memory.nextPlanTick = Game.time + 10;
            creepSay(creep, '💤 NoPath');
        }

        recordCreep(creep.name, creep.memory.role, Game.cpu.getUsed() - _cpuStart, 'planned');
    }

    private getGoalsByRole(creep: Creep, depositTargets: AnyStoreStructure[], containers: StructureContainer[], sites: ConstructionSite[], repairTargets: Structure[]): WorldState[] {
        switch (creep.memory.role) {
            case 'harvester':
            case 'miner':
                return [{ targetFull: true }];

            case 'hauler': {
                const spawnsNeedEnergy = depositTargets.length > 0;
                if (!spawnsNeedEnergy) {
                    const ctrl = creep.room.controller;
                    const upgradeContainerNeedsFilling = ctrl
                        ? containers.some(c =>
                            c.pos.getRangeTo(ctrl) <= 3 &&
                            c.store.getFreeCapacity(RESOURCE_ENERGY) > 0)
                        : false;
                    if (upgradeContainerNeedsFilling) {
                        return [{ upgradeContainerFilled: true }, { targetFull: true }];
                    }
                }
                return [{ targetFull: true }];
            }

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
