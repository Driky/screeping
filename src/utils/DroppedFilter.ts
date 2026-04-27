export function getUsefulDropped(creep: Creep): Resource[] {
    const role = creep.memory.role;

    if (role === 'upgrader') {
        const anyContainerHasEnergy = creep.room.find(FIND_STRUCTURES, {
            filter: s =>
                s.structureType === STRUCTURE_CONTAINER &&
                (s as StructureContainer).store[RESOURCE_ENERGY] > 0
        }).length > 0;
        if (anyContainerHasEnergy) return [];
    }

    const all = creep.room.find(FIND_DROPPED_RESOURCES, {
        filter: r => r.resourceType === RESOURCE_ENERGY
    });

    const storageEnergy = creep.room.storage?.store[RESOURCE_ENERGY] ?? 0;
    const creepCapacity = creep.store.getCapacity(RESOURCE_ENERGY);

    if ((role === 'upgrader' || role === 'builder' || role === 'repairer') &&
        storageEnergy >= creepCapacity) {
        return all.filter(r => r.amount >= creepCapacity / 2);
    }
    return all;
}
