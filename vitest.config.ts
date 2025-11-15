import { defineConfig } from "vitest/config";
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
    test: {
        css: true,
        setupFiles: "./vitest.setup.ts",
        browser: {
            enabled: true,
            provider: playwright(),
            // https://vitest.dev/guide/browser/playwright
            instances: [{ browser: "chromium" }, { browser: "firefox" }, { browser: "webkit" }],
        },
        exclude: [
            "**/node_modules/**",
            "**/dist/**",
            "**/.{idea,git,cache,output,temp}/**",
            "/*.config.*",
            "**/test-axe/**",
        ]
    },
});
