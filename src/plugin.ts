/// <reference types="cypress" />
import fs from 'fs-extra';
import path from 'path';
import { promisify } from 'util';
import { ImageMatchOptions, ImageMatchResult, ImageMatchTaskOptions, matchImageSnapshotTask } from './shared';
const looksSame = require('looks-same');

module.exports = function addLooksSamePlugin(on: any, config: Cypress.ConfigOptions) {
    let screenshotPath = '';

    on('after:screenshot', (e: { path: string }) => screenshotPath = e.path);

    on('task', {
        [matchImageSnapshotTask]: async (options: ImageMatchTaskOptions): Promise<ImageMatchResult> => {
            let snapshotBaseDir = 'cypress/snapshots';
            let snapshotName = `${options.spec} - ${options.name}`;
            let snapshotDir = path.dirname(path.join(snapshotBaseDir, path.relative(config.screenshotsFolder, screenshotPath)));
            let snapshotPath = path.join(snapshotDir, `${snapshotName}.png`);
            let actualPath = path.join(snapshotDir, `${snapshotName}.actual.png`);
            let diffPath = path.join(snapshotDir, `${snapshotName}.diff.png`);

            return await fs.pathExists(snapshotPath) && !config.env.updateImageSnapshots
                ? await compareWithSnapshot(snapshotPath, screenshotPath, actualPath, diffPath, buildDiffConfig(options))
                : await updateSnapshot(snapshotPath, screenshotPath, actualPath, diffPath);
        }
    });
}

async function compareWithSnapshot(snapshotPath: string, screenshotPath: string, actualPath: string, diffPath: string, diffConfig: any) {
    let isSame = await promisify(looksSame)(snapshotPath, screenshotPath, diffConfig);

    if (isSame) {
        await removeGeneratedImages(screenshotPath, actualPath, diffPath);
        return matchResult(snapshotPath, { imagesMatch: true });
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
    await fs.ensureDir(path.dirname(snapshotPath));
    await fs.rename(screenshotPath, snapshotPath);
    await fs.remove(actualPath);
    await fs.remove(diffPath);
    return matchResult(snapshotPath, { snapshotUpdated: true });
}

function buildDiffConfig(options: Partial<ImageMatchOptions>) {
    let strict = options.strict || options.tolerance === 0;
    return {
        strict,
        tolerance: strict ? undefined : options.tolerance,
        pixelRatio: options.pixelRatio,
        ignoreCaret: options.ignoreCaret == null ? true : options.ignoreCaret,
        ignoreAntialiasing: options.ignoreAntialiasing == null ? true : options.ignoreAntialiasing,
        antialiasingTolerance: options.antialiasingTolerance,
        highlightColor: options.highlightColor || '#ff00ff'
    };
}

function matchResult(snapshot: string, results: Partial<ImageMatchResult>): ImageMatchResult {
    return { snapshot, imagesMatch: false, snapshotUpdated: false, ...results };
}