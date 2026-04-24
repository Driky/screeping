import { IAction, WorldState } from "../types/goap";

interface Node {
    state: WorldState;
    parent: Node | null;
    action: IAction | null;
    cost: number;
}

export class GOAPPlanner {
    /**
     * @param actions Liste de toutes les actions possibles
     * @param start État actuel du monde
     * @param goal État souhaité
     */
    public buildPlan(creep: Creep, actions: IAction[], start: WorldState, goal: WorldState): IAction[] | null {
        let openList: Node[] = [];
        let closedList: Node[] = [];

        // Nœud de départ (notre objectif final)
        openList.push({ state: goal, parent: null, action: null, cost: 0 });

        while (openList.length > 0) {
            // Trier par coût (plus petit en premier)
            openList.sort((a, b) => a.cost - b.cost);
            let current = openList.shift()!;
            closedList.push(current);

            // Vérifier si l'état actuel du nœud est satisfait par notre état "start"
            if (this.inState(current.state, start)) {
                return this.reconstructPlan(current);
            }

            // Explorer les actions qui pourraient mener à cet état
            for (let action of actions) {
                if (this.canActionSatisfyState(action, current.state)) {
                    // Calculer le nouvel état requis (pré-conditions de l'action)
                    let nextState = { ...current.state, ...action.preconditions };

                    // Ajouter au graphe
                    openList.push({
                        state: nextState,
                        parent: current,
                        action: action,
                        cost: current.cost + action.getCost(creep)
                    });
                }
            }
        }
        return null; // Aucun plan trouvé
    }

    // Vérifie si toutes les conditions de 'required' sont vraies dans 'current'
    private inState(required: WorldState, current: WorldState): boolean {
        for (let key in required) {
            if (current[key as keyof WorldState] !== required[key as keyof WorldState]) {
                return false;
            }
        }
        return true;
    }

    // Vérifie si l'effet d'une action aide à atteindre l'état requis
    private canActionSatisfyState(action: IAction, state: WorldState): boolean {
        for (let key in action.effects) {
            if (state[key as keyof WorldState] === action.effects[key as keyof WorldState]) {
                return true;
            }
        }
        return false;
    }

    private reconstructPlan(node: Node): IAction[] {
        let plan: IAction[] = [];
        let current: Node | null = node;
        while (current && current.action) {
            plan.push(current.action); // On remonte le fil
            current = current.parent;
        }
        // Pas besoin de reverse() car on a construit du goal vers le start,
        // donc l'ordre de sortie sera : 1ère action à faire -> dernière.
        return plan;
    }
}
