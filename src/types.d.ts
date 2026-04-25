import { WorldState } from "./types/goap";

interface RoomSurvey {
    sources: number;
    controllerLevel: number;
    controllerOwner?: string;
    reservation?: string;
    hasHostiles: boolean;
    lastSurveyTick: number;
}

interface ColonySpawnEntry {
    role: string;
    priority: number;
    homeRoom: string;
    targetRoom?: string;
    sourceId?: string;
}

interface ColonyMemory {
    spawnQueue: ColonySpawnEntry[];
    expansionTarget?: string;
    threatLevel: 0 | 1 | 2;
    surveyedRooms: { [name: string]: RoomSurvey };
}

declare global {
  interface CreepMemory {
    role: string;
    sourceId?: Id<Source>;
    assignedSourceId?: Id<Source>;
    homeRoom?: string;
    targetRoom?: string;
    plan?: string[];
    currentActionIndex?: number;
    goal?: WorldState;
    nextPlanTick?: number;
    lastForceDropTick?: number;
  }

  interface Memory {
    uuid: number;
    log: any;
    debug?: boolean;
    sayEnabled?: boolean;
    sayRoleFilter?: string | string[];
    colony?: ColonyMemory;
  }
}
