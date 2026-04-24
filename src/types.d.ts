import { WorldState } from "./types/goap";

declare global {
  interface CreepMemory {
    role: string;
    // On stocke seulement les noms des actions pour garder la mémoire légère
    plan?: string[];
    currentActionIndex?: number;
    goal?: WorldState;
    nextPlanTick?: number;
  }

  // Permet d'étendre d'autres objets globaux si nécessaire
  interface Memory {
    uuid: number;
    log: any;
  }
}
