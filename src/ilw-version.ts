#!/usr/bin/env node
import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { parseArgs } from "node:util";

const cwd = process.cwd();
const versionsDir = join(cwd, "builder", "versions");

const packageJson = JSON.parse(
    readFileSync(join(cwd, "package.json"), "utf-8")
);
const packageVersion = packageJson.version;
console.log(`Using package version: ${packageVersion}`);

let files: string[] = [];
try {
    console.log(`Reading versions from directory: ${versionsDir}`);
    files = readdirSync(versionsDir).filter((f) => f.endsWith(".json"));
} catch (e) {
    console.error(`Could not read directory: ${versionsDir}`);
    process.exit(1);
}

// Parse arguments and flags
const parsed = parseArgs({
    options: {
        toolkit: { type: "boolean", default: false },
    },
    allowPositionals: true,
});

const options = parsed.values;
const positionals = parsed.positionals;

const channelArg = positionals[0]?.toLowerCase();
let channel: "production" | "beta" | "alpha";
if (channelArg === "beta" || channelArg === "alpha") {
    channel = channelArg;
} else {
    channel = "production";
}


// Custom version parser for major.minor[-prerelease][prereleaseNum]
function parseCustomVersion(version: string) {
    const match = version.match(/^(\d+)\.(\d+)(?:-([a-zA-Z]+)(\d*)?)?$/);
    if (!match) return null;
    const major = parseInt(match[1]);
    const minor = parseInt(match[2]);
    const prerelease = match[3] || undefined;
    const prereleaseNum = match[4]
        ? parseInt(match[4])
        : match[3]
          ? 1
          : undefined;
    return { major, minor, prerelease, prereleaseNum };
}

// Compare two custom versions
function compareCustomVersions(a: string, b: string): number {
    const va = parseCustomVersion(a);
    const vb = parseCustomVersion(b);
    if (!va || !vb) return 0;
    if (va.major !== vb.major) return va.major - vb.major;
    if (va.minor !== vb.minor) return va.minor - vb.minor;
    if (!va.prerelease && vb.prerelease) return 1;
    if (va.prerelease && !vb.prerelease) return -1;
    if (!va.prerelease && !vb.prerelease) return 0;
    if (va.prerelease !== vb.prerelease)
        // fortunately alpha and beta sort alphabetically
        return va.prerelease! < vb.prerelease! ? -1 : 1;
    // Both have same prerelease
    return (va.prereleaseNum || 1) - (vb.prereleaseNum || 1);
}

const latest: Record<string, { version: string; filename: string }> = {};

for (const file of files) {
    // Example: ilw-card.1.2-beta.json
    const match = file.match(/^(.*)\.(\d+\.\d+(?:-[a-zA-Z]+\d*)?)\.json$/);
    if (!match) continue;
    const component = match[1];
    const version = match[2];
    if (
        !latest[component] ||
        compareCustomVersions(version, latest[component].version) > 0
    ) {
        latest[component] = { version, filename: file };
    }
}

if (Object.keys(latest).length === 0) {
    console.log("No valid versioned component JSON files found.");
    process.exit(1);
}

for (const [component, { version, filename }] of Object.entries(latest)) {
    const filePath = join(versionsDir, filename);
    try {
        const json: any = JSON.parse(readFileSync(filePath, "utf-8"));
        console.log(`Component: ${component}, Version: ${version}`);
        let parsedVersion = parseCustomVersion(version)!;

        let nextVersion: string | null;

        if (channel === "production") {
            if (parsedVersion.prerelease) {
                // Move from prerelease to production of same major.minor
                nextVersion = parsedVersion.major + "." + parsedVersion.minor;
            } else {
                // Increment minor version for next production release
                nextVersion =
                    parsedVersion.major + "." + (parsedVersion.minor + 1);
            }
        } else if (channel === "beta") {
            nextVersion =
                parsedVersion.major + "." + parsedVersion.minor + "-beta";
            if (parsedVersion.prerelease === "beta") {
                nextVersion += parsedVersion.prereleaseNum
                    ? parsedVersion.prereleaseNum + 1
                    : 2;
            }
        } else if (channel === "alpha") {
            nextVersion =
                parsedVersion.major + "." + parsedVersion.minor + "-alpha";
            if (parsedVersion.prerelease === "alpha") {
                nextVersion += parsedVersion.prereleaseNum
                    ? parsedVersion.prereleaseNum + 1
                    : 2;
            }
        } else {
            console.error(`Unknown channel: ${channel}`);
            process.exit(1);
        }
        console.log(`Next ${channel} version: ${nextVersion}`);

        json["builder-version"] = nextVersion;
        json["version"] = packageVersion;
        json["date"] = new Date().toLocaleDateString("en-US");

        if (channel === "production") {
            json["production"] = true;
            json["css"] = `https://cdn.toolkit.illinois.edu/${component}/${packageVersion}/${component}.css`;
            json["js"] = `https://cdn.toolkit.illinois.edu/${component}/${packageVersion}/${component}.js`;
        } else {
            json["production"] = false;
            json["css"] = `https://dev.toolkit.illinois.edu/${component}/${nextVersion}/${component}.css`;
            json["js"] = `https://dev.toolkit.illinois.edu/${component}/${nextVersion}/${component}.js`;
        }

        const outputPath = join(versionsDir, `${component}.${nextVersion}.json`);
        writeFileSync(outputPath, JSON.stringify(json, null, 4));
        console.log(`Next version written to: ${outputPath}`);

        const builderFile: any = JSON.parse(readFileSync(join(cwd, "builder", `${component}.json`), "utf-8"));

        if (channel === "production") {
            builderFile["production-version"] = nextVersion;
        } else {
            builderFile["development-version"] = nextVersion;
        }

        if (options.toolkit) {
            builderFile["toolkit-version"] = nextVersion;
        }

        writeFileSync(join(cwd, "builder", `${component}.json`), JSON.stringify(builderFile, null, 4));
        console.log(`Builder file updated: builder/${component}.json`);
    } catch (e) {
        console.error(`Failed to load JSON for ${filename}:`, e);
    }
}
