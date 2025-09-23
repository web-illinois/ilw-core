# ilw-core

Shared testing code for Illinois Toolkit components.

## Adding to an existing repository

Add `@illinois-toolkit/ilw-core` to devDependencies in package.json, `npm install -D @illinois-toolkit/ilw-core`.

Add the following lines to `.gitignore`:

```
test-results/
playwright-report/
```

Add new GitHub Actions by copying the contents of [`./workflows`](./workflows) to `.github/workflows` in the component project,
and delete `publish_npm.yml` if it exists.

Then follow the instructions below to add axe-core, and optionally Vitest.

### axe-core

#### 1. Playwright config

Copy `playwright.*.ts` from this project to the component project root.

#### 2. Test system dependencies

Add the following dependencies to devDependencies:

```
npm install -D \
  @playwright/test@^1.54.1 \
  playwright@^1.54.1
```

#### 3. Test scripts

Add the following scripts to package.json:

```json
{
    "scripts": {
        "test:axe": "playwright test",
        "test:axe:github": "playwright test --config=playwright.ci.config.ts"
    }
}
```

#### 4. Test file

Copy the `test-axe` directory from this project to the component project root.

#### 5. Sample variations file

Create a `samples/variations.html` file with a few sample components with unique IDs, but none of the configurable attributes.

Use `createVariations` at the bottom of the HTML file, an example is shown below. Adjust the attributes
to match the component's configuration.

```html
<script type="module">
    import { createVariations } from "@illinois-toolkit/ilw-core";
    import Card from "../src/ilw-card.js";

    createVariations(document.getElementById("grid"), Card, {
        theme: ["white", "gray", "orange", "blue", "orange-gradient", "blue-gradient"],
        clickable: [true, undefined],
        align: ["left", "center"],
        aspectRatio: [undefined, "16/9", "4/3", "1/1"],
        tag: ["article", "div"],
    }, [
        "plain-card",
        "image-card",
        "footer-card",
        "icon-card"
    ]);
</script>
```

**Alternatively**, you can also just use the `samples/index.html` file, or any other HTML file,
by modifying the `test-axe/axe.test.ts` as follows:

```typescript
const result = await axeTestFunction(page, testInfo, "./samples/index.html");
```

#### 5. Install Playwright browsers

Run `npx playwright install` to install the necessary browsers.

#### 6. Run tests

Run `npm run test:axe` to run the tests locally.

### Vitest (optional)

First, check that you're using Vite 7+. If not, upgrade Vite to 7+ as follows:

- Upgrade all related dev dependencies to latest
    - vite
    - vite-plugin-dts
- Change the assetFileNames function in both `vite.build.config.ts` and `vite.transpile.config.ts` to the following:

```typescript
assetFileNames: () => {
    return "[name][extname]";
}
```

#### 1. Vitest config

Copy `vitest.*.ts` from this project to the component project root. This includes the config
file and the setup file.

#### 2. Test system dependencies

Add the following dependencies to devDependencies:

```
npm install -D \
  @vitest/browser@^3.2.4 \
  vitest-browser-lit@^0.1.0
```

#### 3. Test script

Add or replace the following script in package.json:

```json
{
    "scripts": {
        "test": "vitest run --browser.headless",
        "test:browser": "vitest watch --browser chromium"
    }
}
```

#### 4. Add tests

Create a `test` directory in the component project root and add test files there.

For examples, you can refer to [ilw-card tests](https://github.com/web-illinois/ilw-card/tree/1683db84c6a80958848e37fd10b7f096ded8240f/test).


### Custom Vitest Assertions

#### `toBeInViewport`

Asserts that an element is in the viewport. To use, import the `expect` package in your test file:

```typescript
import "@illinois-toolkit/ilw-core/expect";
```

Then use it in a test, for example:

```typescript
const element = screen.getByText("Tundra Pic");
await expect.element(element).toBeInViewport();
```
