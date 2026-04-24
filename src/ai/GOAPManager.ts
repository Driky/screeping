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

    /**
     * Gère le suivi et l'exécution du plan stocké en mémoire
     */
    private executePlan(creep: Creep): void {
        // Sécurité : vérifier si l'index est valide
        const currentIndex = creep.memory.currentActionIndex || 0;
        const plan = creep.memory.plan || [];

        if (currentIndex >= plan.length) {
            // Plan terminé
            creep.memory.plan = [];
            return;
        }

        this.drawVisualPlan(creep, plan, currentIndex);

        // Trouver l'action correspondante dans notre liste d'actions injectée
        const actionName = plan[currentIndex];
        const currentAction = this.actions.find(a => a.name === actionName);

        if (currentAction) {
            // Exécuter l'action
            const isFinished = currentAction.execute(creep);
            creep.say(currentAction.name);

            if (isFinished) {
                // Passer à l'action suivante au prochain tick
                creep.memory.currentActionIndex = currentIndex + 1;

                // Si c'était la dernière action, on nettoie tout de suite
                if (creep.memory.currentActionIndex >= plan.length) {
                    creep.memory.plan = [];
                    creep.memory.currentActionIndex = 0;
                }
            }
        } else {
            // Si l'action n'est pas reconnue (ex: renommage), on reset le plan
            creep.memory.plan = [];
        }
    }

    public run(creep: Creep, sources: Source[], sites: ConstructionSite[], depositTargets: AnyStoreStructure[], containers: StructureContainer[], dropped: Resource[]): void {
        // OPTIMISATION 1 : Si le CPU est trop bas (bucket vide), on saute ce tour
        if (Game.cpu.bucket < 500 && Game.cpu.getUsed() > Game.cpu.limit * 0.8) return;

        // 1. Vérifier si on a déjà un plan en cours
        if (creep.memory.plan && creep.memory.plan.length > 0) {
            this.executePlan(creep);
            return;
        }

        // 2. Gestion du Cooldown de planification
        if (creep.memory.nextPlanTick && Game.time < creep.memory.nextPlanTick) {
            return; // Trop tôt pour replanifier
        }

        // 3. Tentative de planification
        const currentState = WorldSensor.getCurrentState(creep, sources, sites, depositTargets, containers, dropped);
        const goalState = this.getGoalByRole(creep);

        const plan = this.planner.buildPlan(creep, this.actions, currentState, goalState);

        if (plan && plan.length > 0) {
            creep.memory.plan = plan.map(a => a.name);
            creep.memory.currentActionIndex = 0;
            delete creep.memory.nextPlanTick; // On efface le cooldown si succès
        } else {
            // ÉCHEC : On attend 10 ticks avant de stresser le CPU à nouveau
            creep.memory.nextPlanTick = Game.time + 10;
            creep.say('💤 NoPath');
        }
    }

    private getGoalByRole(creep: Creep): WorldState {

        switch (creep.memory.role) {
            case 'harvester':
                return { targetFull: true };

            case 'upgrader':
                return{ controllerUpgraded: true };

            case 'builder':
                // S'il n'y a rien à construire, le builder devient un harvester par défaut
                const sites = creep.room.find(FIND_CONSTRUCTION_SITES);
                return sites.length > 0 ? { buildTargetDone: true } : { targetFull: true };

            default:
                return {};
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
