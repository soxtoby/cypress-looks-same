/// <reference types="cypress" />
/// <reference path="./commands.d.ts" />
import { ImageMatchOptions, ImageMatchResult, matchImageSnapshotTask } from "./shared";

export default function (defaults?: Partial<ImageMatchOptions>) {
    defaults = defaults || {};
    let continueWhenLooksDifferent = !!Cypress.env().continueWhenLooksDifferent;

    Cypress.Commands.add('shouldLookSameAs', { prevSubject: ['optional', 'element'] }, shouldLookSameAs);
    Cypress.Commands.add('compareWithImageSnapshot', { prevSubject: ['optional', 'element'] }, compareWithImageSnapshot);

    function shouldLookSameAs(this: { test: Mocha.Test }, element: JQuery<HTMLElement>, name: string, options: Partial<ImageMatchOptions> = {}) {
        let log = createLog(name);

        return cy.wrap(element, { log: false })
            .compareWithImageSnapshot(name, { ...options, log: false })
            .then(updateLog(log))
            .then(result => {
                if (!result.imagesMatch) {
                    let error = mismatchError(name);
                    log.error(error);
                    if (!continueWhenLooksDifferent)
                        throw error;
                }

                return element;
            });
    }

    function compareWithImageSnapshot(this: { test: Mocha.Test }, element: JQuery<HTMLElement>, name: string, options: Partial<ImageMatchOptions & Cypress.Loggable> = {}) {
        options = { ...defaults, ...options };

        let spec = this.test.fullTitle();
        let log = options.log === false
            ? null
            : createLog(name, element);

        function compare() {
            return (element
                ? cy.wrap(element, { log: false })
                    .scrollIntoView({ log: false })
                : cy)
                .screenshot({ ...(options as Cypress.ScreenshotOptions), log: false })
                .task(matchImageSnapshotTask, { ...options, spec, name }, { log: false })
                .then(updateLog(log))
                .then(result => (cy as any).verifyUpcomingAssertions(result, options, { onRetry: compare })) as Cypress.Chainable<ImageMatchResult>;
        }

        return compare();
    }
}

function createLog(name: string, element?: JQuery<HTMLElement>) {
    let log = {} as IImageMatchLog;
    log = Cypress.log({
        name: 'assert', // Makes message look like an assertion in test runner
        message: [`matches image **${name}**`],
        $el: element,
        consoleProps: () => log.result
    }) as IImageMatchLog;
    log.result = {} as ImageMatchResult;
    return log;
}

function updateLog(log: IImageMatchLog | null) {
    return (result: any) => {
        if (log)
            log.result = result;
        return result as ImageMatchResult;
    }
}

function mismatchError(name: string) {
    return Object.assign(
        new chai.AssertionError(`'${name}' image looks different`),
        { onFail() { } }); // Stops Cypress from adding an extra log message for the error
}

interface IImageMatchLog extends Cypress.Log {
    error(err: Error): void;
    result: ImageMatchResult;
}