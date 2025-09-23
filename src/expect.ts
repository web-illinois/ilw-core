import "vitest";
import { expect } from "vitest";

interface CustomMatchers<R = unknown> {
    toBeInViewport: () => R;
}

declare module "vitest" {
    interface Matchers<T = any> extends CustomMatchers<T> {}
}
expect.extend({
    toBeInViewport(element: HTMLElement) {
        const { isNot } = this;
        if (!element) {
            return {
                pass: false,
                message: () => `Element not found`,
            };
        }
        const rect = element.getBoundingClientRect();
        const inViewport =
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <=
                (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <=
                (window.innerWidth || document.documentElement.clientWidth);

        return {
            pass: inViewport,
            message: () => `${element} is${isNot ? " not" : ""} foo`,
        };
    },
});
