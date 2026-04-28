export type WorldState = {
    hasEnergy?: boolean;
    atSource?: boolean;
    atTarget?: boolean;
    nearController?: boolean;
    nearConstruction?: boolean;
    nearContainerWithEnergy?: boolean;
    nearDropped?: boolean;
    nearStorage?: boolean;
    storageHasEnergy?: boolean;
    nearLink?: boolean;
    nearUpgradeContainer?: boolean;
    nearTower?: boolean;
    nearEnemy?: boolean;
    enemyDead?: boolean;
    inTargetRoom?: boolean;
    controllerClaimed?: boolean;
    controllerReserved?: boolean;
    targetFull?: boolean;
    upgradeContainerFilled?: boolean;
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
