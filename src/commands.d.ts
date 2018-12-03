import { ImageMatchOptions, ImageMatchResult } from './shared';

declare global {
    namespace Cypress {
        interface Chainable<Subject = any> {
            shouldLookSameAs(name: string, options?: Partial<ImageMatchOptions>): Chainable<Subject>;
            compareWithImageSnapshot(name: string, options?: Partial<ImageMatchOptions & Loggable>): Chainable<ImageMatchResult>;
        }
    }
}