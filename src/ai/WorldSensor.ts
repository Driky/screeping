import { WorldState } from "types/goap";
import { log } from "utils/Logger";
import { getUsefulDropped } from "utils/DroppedFilter";

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

        const ctrl = creep.room.controller;
        const isUpgrader = creep.memory.role === 'upgrader';
        const energyContainers = containers.filter(c =>
            c.store[RESOURCE_ENERGY] > 0 && (isUpgrader || !ctrl || c.pos.getRangeTo(ctrl) > 3)
        );
        const closeContainer = creep.pos.findClosestByRange(energyContainers);
        state.nearContainerWithEnergy = closeContainer ? creep.pos.isNearTo(closeContainer) : false;

        const usefulDropped = getUsefulDropped(creep);
        const closeDropped = creep.pos.findClosestByRange(usefulDropped);
        state.nearDropped = closeDropped ? creep.pos.isNearTo(closeDropped) : false;

        const storage = creep.room.storage;
        state.nearStorage = storage ? creep.pos.isNearTo(storage) : false;

        const links = creep.room.find(FIND_MY_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_LINK &&
                (s as StructureLink).store.getFreeCapacity(RESOURCE_ENERGY) > 0
        }) as StructureLink[];
        const closeLink = creep.pos.findClosestByRange(links);
        state.nearLink = closeLink ? creep.pos.isNearTo(closeLink) : false;

        if (ctrl) {
            const upgradeContainer = containers.find(c => c.pos.getRangeTo(ctrl) <= 3);
            state.nearUpgradeContainer = upgradeContainer ? creep.pos.isNearTo(upgradeContainer) : false;
        } else {
            state.nearUpgradeContainer = false;
        }

        const towers = creep.room.find(FIND_MY_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_TOWER &&
                (s as StructureTower).store.getFreeCapacity(RESOURCE_ENERGY) > 0
        }) as StructureTower[];
        const closeTower = creep.pos.findClosestByRange(towers);
        state.nearTower = closeTower ? creep.pos.isNearTo(closeTower) : false;

        const hostiles = creep.room.find(FIND_HOSTILE_CREEPS);
        const closeHostile = creep.pos.findClosestByRange(hostiles);
        state.nearEnemy = closeHostile ? creep.pos.isNearTo(closeHostile) : false;
        state.enemyDead = false;

        state.inTargetRoom = creep.memory.targetRoom
            ? creep.room.name === creep.memory.targetRoom
            : false;

        {
            const dist = closeDropped ? creep.pos.getRangeTo(closeDropped) : -1;
            log('sensor', `${creep.name} nearDropped=${state.nearDropped} closest=${closeDropped ? closeDropped.pos : 'none'} dist=${dist} amount=${closeDropped?.amount ?? 0}`, 'debug', creep.memory.role);
        }



        // Terminal goal states always start false — set true only by action effects
        state.targetFull = false;
        state.upgradeContainerFilled = false;
        state.controllerUpgraded = false;
        state.buildTargetDone = false;
        state.structureRepaired = false;
        state.controllerClaimed = false;
        state.controllerReserved = false;

        if (creep.memory.role === 'claimer' || creep.memory.role === 'reserver') {
            log('sensor', `${creep.name} pos=${creep.pos} room=${creep.room.name} targetRoom=${creep.memory.targetRoom} plan=${JSON.stringify(creep.memory.plan)} planIdx=${creep.memory.currentActionIndex} inTargetRoom=${state.inTargetRoom}`, 'debug', creep.memory.role);
        }

        return state;
    }
}
