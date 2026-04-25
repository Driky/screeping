import { WorldState } from "./types/goap";

declare global {
  interface CreepMemory {
    role: string;
    sourceId?: Id<Source>;
    assignedSourceId?: Id<Source>;
    // On stocke seulement les noms des actions pour garder la mémoire légère
    plan?: string[];
    currentActionIndex?: number;
    goal?: WorldState;
    nextPlanTick?: number;
    lastForceDropTick?: number;
  }

  // Permet d'étendre d'autres objets globaux si nécessaire
  interface Memory {
    uuid: number;
    log: any;
  }
}
