export type WorldState = {
    hasEnergy?: boolean;
    atSource?: boolean;
    atTarget?: boolean;
    nearController?: boolean;
    nearConstruction?: boolean;
    nearContainer?: boolean;
    nearDropped?: boolean;
    targetFull?: boolean;
    controllerUpgraded?: boolean;
    buildTargetDone?: boolean;
    structureRepaired?: boolean;
};

export interface IAction {
    name: string;
    preconditions: WorldState;
    effects: WorldState;
    roles?: string[];
    getCost(creep: Creep): number;
    execute(creep: Creep): boolean;
}
