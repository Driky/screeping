import { WorldState } from "types/goap";

export class WorldSensor {
    /**
     * Analyse le creep et son environnement pour générer l'état actuel
     */
    public static getCurrentState(creep: Creep, sources: Source[], sites: ConstructionSite[], depositTargets: AnyStoreStructure[], containers: StructureContainer[], dropped: Resource[]): WorldState {
        const state: WorldState = {};

        // 1. État des ressources
        state.hasEnergy = creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0;

        // 2. Proximité de la Source d'énergie
        const mySource = creep.memory.sourceId
            ? Game.getObjectById(creep.memory.sourceId)
            : creep.pos.findClosestByRange(sources);
        state.atSource = mySource ? creep.pos.isNearTo(mySource) : false;

        // 3. Proximité du Controller
        state.nearController = creep.room.controller ? creep.pos.isNearTo(creep.room.controller) : false;

        // Proximité Construction
        const site = creep.pos.findClosestByRange(sites);
        state.nearConstruction = site ? creep.pos.isNearTo(site) : false;

        // Proximité cible de dépôt (spawn/extension avec de la place)
        const depositTarget = creep.pos.findClosestByRange(depositTargets);
        state.atTarget = depositTarget ? creep.pos.isNearTo(depositTarget) : false;

        const closeContainer = creep.pos.findClosestByRange(containers);
        state.nearContainer = closeContainer ? creep.pos.isNearTo(closeContainer) : false;

        const closeDropped = creep.pos.findClosestByRange(dropped);
        state.nearDropped = closeDropped ? creep.pos.isNearTo(closeDropped) : false;
        if (Memory.debug && creep.memory.role === 'hauler') {
            const dist = closeDropped ? creep.pos.getRangeTo(closeDropped) : -1;
            console.log(`[Sensor] ${creep.name} nearDropped=${state.nearDropped} closest=${closeDropped ? closeDropped.pos : 'none'} dist=${dist} amount=${closeDropped?.amount ?? 0}`);
        }



        // Réinitialisation des objectifs finaux
        state.targetFull = false;
        state.controllerUpgraded = false;
        state.buildTargetDone = false;
        state.structureRepaired = false;

        return state;
    }
}
