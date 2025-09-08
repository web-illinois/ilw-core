import { LitElement } from "lit";

type InferProps<T> = T extends LitElement
    ? {
          [K in keyof T]: T[K] extends string | number | boolean
              ? T[K][]
              : never;
      }
    : never;

/**
 * Creates variations of a LitElement component by cloning existing elements
 * and applying different combinations of property values.
 *
 * @param parent The parent element to which the variations will be appended.
 * @param component The LitElement component class.
 * @param variations An object where keys are property names and values are arrays of possible values. undefined values omit the property.
 * @param ids An array of element IDs in the document to clone and apply variations to.
 */
export function createVariations<T extends LitElement>(
    parent: HTMLElement,
    component: new () => T,
    variations: Partial<InferProps<T>>,
    ids: string[],
) {
    // Helper to get all combinations of property values
    function getCombinations(
        props: Record<string, any[]>,
    ): Record<string, any>[] {
        const keys = Object.keys(props);
        if (keys.length === 0) return [{}];
        const [first, ...rest] = keys;
        const restCombinations = getCombinations(
            Object.fromEntries(rest.map((k) => [k, props[k]])),
        );
        const result: Record<string, any>[] = [];
        for (const value of props[first]) {
            for (const combo of restCombinations) {
                result.push({ [first]: value, ...combo });
            }
        }
        return result;
    }

    const combos = getCombinations(variations as Record<string, any[]>);

    for (let id of ids) {
        const base = document.getElementById(id);
        if (!base) continue;
        for (const combo of combos) {
            const el = base.cloneNode(true) as HTMLElement;
            el.id = "";
            for (const key in combo) {
                if (combo[key] !== undefined) {
                    el.setAttribute(key, combo[key]);
                }
            }
            parent.appendChild(el);
        }
    }
}
