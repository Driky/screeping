import { WorldState } from "types/goap";

export class WorldSensor {
    /**
     * Analyse le creep et son environnement pour générer l'état actuel
     */
    public static getCurrentState(creep: Creep, sources: Source[], sites: ConstructionSite[], depositTargets: AnyStoreStructure[]): WorldState {
        const state: WorldState = {};

        // 1. État des ressources
        state.hasEnergy = creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0;

        // 2. Proximité de la Source d'énergie
        const closestSource = creep.pos.findClosestByRange(sources);
        state.atSource = closestSource ? creep.pos.isNearTo(closestSource) : false;

        // 3. Proximité du Controller
        state.nearController = creep.room.controller ? creep.pos.isNearTo(creep.room.controller) : false;

        // Proximité Construction
        const site = creep.pos.findClosestByRange(sites);
        state.nearConstruction = site ? creep.pos.isNearTo(site) : false;

        // Proximité cible de dépôt (spawn/extension avec de la place)
        const depositTarget = creep.pos.findClosestByRange(depositTargets);
        state.atTarget = depositTarget ? creep.pos.isNearTo(depositTarget) : false;

        // Réinitialisation des objectifs finaux
        state.targetFull = false;
        state.controllerUpgraded = false;
        state.buildTargetDone = false;

        return state;
    }
}
