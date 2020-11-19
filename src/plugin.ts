/// <reference types="cypress" />
import fs from 'fs-extra';
import path from 'path';
import { promisify } from 'util';
import { ImageMatchOptions, ImageMatchResult, ImageMatchTaskOptions, matchImageSnapshotTask } from './shared';
const looksSame = require('looks-same');

module.exports = function addLooksSamePlugin(on: any, config: Cypress.ResolvedConfigOptions) {
    let screenshotPath = '';

    on('after:screenshot', (e: { path: string }) => screenshotPath = e.path);

    on('task', {
        [matchImageSnapshotTask]: async (options: ImageMatchTaskOptions): Promise<ImageMatchResult> => {
            let snapshotBaseDir = 'cypress/snapshots';
            let snapshotName = `${options.spec} - ${options.name}`;
            let snapshotDir = path.dirname(path.join(snapshotBaseDir, path.relative(config.screenshotsFolder || "cypress/screenshots", screenshotPath)));
            let snapshotPath = path.join(snapshotDir, `${snapshotName}.png`);
            let actualPath = path.join(snapshotDir, `${snapshotName}.actual.png`);
            let diffPath = path.join(snapshotDir, `${snapshotName}.diff.png`);

            return await fs.pathExists(snapshotPath)
                ? await compareWithSnapshot(snapshotPath, screenshotPath, actualPath, diffPath, buildDiffConfig(options), config)
                : await updateSnapshot(snapshotPath, screenshotPath, actualPath, diffPath);
        }
    });
}

async function compareWithSnapshot(snapshotPath: string, screenshotPath: string, actualPath: string, diffPath: string, diffConfig: any, cypressConfig: Cypress.ResolvedConfigOptions) {
    let isSame = await promisify(looksSame)(snapshotPath, screenshotPath, diffConfig);

    if (isSame) {
        await removeGeneratedImages(screenshotPath, actualPath, diffPath);
        return matchResult(snapshotPath, { imagesMatch: true });
    } else if (cypressConfig.env.updateImageSnapshots) {
        return await updateSnapshot(snapshotPath, screenshotPath, actualPath, diffPath);
    } else {
        await createActualAndDiffImages(snapshotPath, screenshotPath, diffPath, diffConfig, actualPath);
        return matchResult(snapshotPath, {
            actual: path.resolve(actualPath),
            diff: path.resolve(diffPath)
        });
    }
}

async function removeGeneratedImages(screenshotPath: string, actualPath: string, diffPath: string) {
    await fs.remove(screenshotPath);
    await fs.remove(actualPath);
    await fs.remove(diffPath);
}

async function createActualAndDiffImages(snapshotPath: string, screenshotPath: string, diffPath: string, diffConfig: any, actualPath: string) {
    await fs.ensureDir(path.dirname(snapshotPath));
    await promisify(looksSame.createDiff)({
        reference: snapshotPath,
        current: screenshotPath,
        diff: diffPath,
        ...diffConfig
    });
    await fs.rename(screenshotPath, actualPath);
}

async function updateSnapshot(snapshotPath: string, screenshotPath: string, actualPath: string, diffPath: string) {
    let newSnapshot = !await fs.pathExists(snapshotPath);
    await fs.ensureDir(path.dirname(snapshotPath));
    await fs.rename(screenshotPath, snapshotPath);
    await fs.remove(actualPath);
    await fs.remove(diffPath);
    return matchResult(snapshotPath, { imagesMatch: newSnapshot, snapshotUpdated: true });
}

function buildDiffConfig(options: Partial<ImageMatchOptions>) {
    let strict = options.strict || options.tolerance === 0;

    let diffConfig = {
        strict,
        ignoreCaret: options.ignoreCaret == null ? true : options.ignoreCaret,
        ignoreAntialiasing: options.ignoreAntialiasing == null ? true : options.ignoreAntialiasing,
        highlightColor: options.highlightColor || '#ff00ff'
    } as any;

    if (!strict && options.tolerance != null)
        diffConfig.tolerance = options.tolerance;
    if (options.pixelRatio != null)
        diffConfig.pixelRatio = options.pixelRatio;
    if (options.antialiasingTolerance != null)
        diffConfig.antialiasingTolerance = options.antialiasingTolerance;

    return diffConfig;
}

function matchResult(snapshot: string, results: Partial<ImageMatchResult>): ImageMatchResult {
    return { snapshot, imagesMatch: false, snapshotUpdated: false, ...results };
}