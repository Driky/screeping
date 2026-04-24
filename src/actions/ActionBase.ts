import { IAction, WorldState } from "../types/goap";

export abstract class ActionBase implements IAction {
    abstract name: string;
    abstract preconditions: WorldState;
    abstract effects: WorldState;

    public getCost(creep: Creep): number {
        return 1; // Coût par défaut
    }

    abstract execute(creep: Creep): boolean;
}
