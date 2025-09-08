import AxeBuilder from "@axe-core/playwright";
import * as fs from "node:fs";
import { createHtmlReport } from "axe-html-reporter";
import { Page } from "@playwright/test";

export const axeTestFunction: (
    page: any,
    testInfo: any,
    htmlFile?: string,
) => Promise<boolean> = async (page: Page, testInfo, htmlFile) => {
    await page.goto(htmlFile || "./samples/variations.html", {waitUntil: "domcontentloaded"});

    const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

    if (!fs.existsSync("dist/cdn")) {
        fs.mkdirSync("dist/cdn", {
            recursive: true,
        });
    }
    const pjson = fs.readFileSync("package.json", "utf-8");
    const project = JSON.parse(pjson).name;
    const report = createHtmlReport({
        results: accessibilityScanResults,
        options: {
            doNotCreateReportFile: true,
            // Get project key from package.json
            projectKey: project,
        },
    });
    fs.writeFileSync("dist/cdn/axe.html", report, "utf-8");
    await testInfo.attach("Axe Report", {
        path: "dist/cdn/axe.html",
        contentType: "text/html",
    });

    return accessibilityScanResults.violations.length === 0;
};
