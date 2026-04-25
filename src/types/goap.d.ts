export type WorldState = {
    hasEnergy?: boolean;
    atSource?: boolean;
    atTarget?: boolean;
    nearController?: boolean;
    nearConstruction?: boolean;
    nearContainer?: boolean;
    nearDropped?: boolean;
    nearStorage?: boolean;
    nearLink?: boolean;
    nearTower?: boolean;
    nearEnemy?: boolean;
    enemyDead?: boolean;
    inTargetRoom?: boolean;
    controllerClaimed?: boolean;
    controllerReserved?: boolean;
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
