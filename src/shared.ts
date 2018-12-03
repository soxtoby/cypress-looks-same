/** 
 * Options to configure screenshot and image comparison.
 * See https://docs.cypress.io/api/commands/screenshot.html and https://github.com/gemini-testing/looks-same for more details.
 */
export interface ImageMatchOptions extends Cypress.Timeoutable, Cypress.ScreenshotOptions {
    /** By default, only noticeable differences will be detected. If you wish to detect any difference, use strict (default: false) */
    strict: boolean;
    /** Adjust the ΔE value that will be treated as error in non-strict mode (default: 2.3) */
    tolerance: number;
    /** Pixel ratio of the device (default: 1) */
    pixelRatio: number;
    /** Ignore text caret in text input elements (default: true) */
    ignoreCaret: boolean;
    /** Ignore differences caused by anti-aliasing (default: true) */
    ignoreAntialiasing: boolean;
    /** Increase the tolerance when detecting anti-aliased pixels (default: 0) */
    antialiasingTolerance: number;
    /** Color used to highlight differences (default: #ff00ff) */
    highlightColor: string;
}

export type ImageMatchTaskOptions = Partial<ImageMatchOptions> & {
    spec: string;
    name: string;
}

export interface ImageMatchResult {
    imagesMatch: boolean;
    snapshotUpdated: boolean;
    snapshot: string;
    actual?: string;
    diff?: string;
}

export const matchImageSnapshotTask = 'cypress-looks-same:match';