import { ActionBase } from "./ActionBase";
import { WorldState } from "../types/goap";
import { log } from "../utils/Logger";

export class HaulerPickupAction extends ActionBase {
    name = "haulerPickup";
    roles = ['hauler'];
    preconditions: WorldState = { nearDropped: true, hasEnergy: false };
    effects: WorldState = { hasEnergy: true };

    public getCost(creep: Creep): number {
        const dropped = this.findDropped(creep);
        return dropped ? 1 : 5;
    }

    public execute(creep: Creep): boolean {
        // Cooldown after a forced drop to break the forceDrop→pickup loop
        if (creep.memory.lastForceDropTick && Game.time - creep.memory.lastForceDropTick < 10) {
            log('hauler', `${creep.name} cooldown (lastDrop=${creep.memory.lastForceDropTick} now=${Game.time}), clearing plan`, 'debug');
            creep.memory.plan = [];
            return true;
        }
        const dropped = this.findDropped(creep);
        log('hauler', `${creep.name} target=${dropped ? `${dropped.pos} amount=${dropped.amount} dist=${creep.pos.getRangeTo(dropped)}` : 'null'}`, 'debug');
        if (!dropped) { creep.memory.plan = []; return true; }
        const result = creep.pickup(dropped);
        log('hauler', `${creep.name} pickup result=${result}`, 'debug');
        if (result === ERR_NOT_IN_RANGE) { creep.memory.plan = []; return true; }
        return result === OK || creep.store.getFreeCapacity() === 0;
    }

    private findDropped(creep: Creep): Resource | null {
        const all = creep.room.find(FIND_DROPPED_RESOURCES, {
            filter: r => r.resourceType === RESOURCE_ENERGY
        });
        if (!all.length) return null;

        if (creep.memory.assignedSourceId) {
            const source = Game.getObjectById(creep.memory.assignedSourceId);
            if (source) {
                const zoned = all.filter(r => source.pos.getRangeTo(r) <= 3);
                if (zoned.length) return creep.pos.findClosestByRange(zoned);
            }
        }
        return creep.pos.findClosestByRange(all);
    }
}
