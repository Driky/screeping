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
        let closedList: string[] = [];

        // Nœud de départ (notre objectif final)
        openList.push({ state: goal, parent: null, action: null, cost: 0 });

        let iterations = 0;
        const MAX_ITERATIONS = 100; // Sécurité CPU

        while (openList.length > 0) {
            iterations++;
            if (iterations > MAX_ITERATIONS) {
                console.log(`[GOAP] ${creep.name} : Trop d'itérations, abandon.`);
                return null;
            }

            // Trier par coût (plus petit en premier)
            openList.sort((a, b) => a.cost - b.cost);
            let current = openList.shift()!;

            if (this.inState(current.state, start)) {
                return this.reconstructPlan(current);
            }

            closedList.push(JSON.stringify(current.state));
            console.log(`[GOAP] ${creep.name} (${creep.memory.role}) node: ${JSON.stringify(current.state)}`);
            // Explorer les actions qui pourraient mener à cet état
            for (const action of actions) {
                if (this.canActionSatisfyState(action, current.state)) {

                    let nextState = { ...current.state };

                    for (const effect in action.effects) {
                        delete nextState[effect as keyof WorldState];
                    }

                    nextState = { ...nextState, ...action.preconditions };

                    if (closedList.includes(JSON.stringify(nextState))) continue;

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

        if (iterations >= MAX_ITERATIONS) {
            console.log(`[GOAP] ${creep.name} : ÉCHEC - Trop complexe (Explosion combinatoire)`);
        } else {
            console.log(`[GOAP] ${creep.name} : ÉCHEC - Aucun chemin de l'état actuel vers le but.`);
            console.log(`[GOAP] État actuel: ${JSON.stringify(start)}`);
        }
        return null; // Aucun plan trouvé
    }

    // Vérifie si toutes les conditions de 'required' sont vraies dans 'current'
    private inState(required: WorldState, current: WorldState): boolean {
        if (Object.keys(required).length === 0) return true;

        for (const key in required) {
            // On ne compare QUE les clés qui sont définies dans 'required'
            const reqVal = required[key as keyof WorldState];
            const curVal = current[key as keyof WorldState];

            // On ignore les clés non définies
            if (reqVal === undefined) continue;

            // Comparaison stricte des booléens
            if (curVal !== reqVal) {
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
