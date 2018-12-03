# cypress-looks-same
A plugin to [Cypress](https://cypress.io) for visual regression testing, based on [looks-same](https://github.com/gemini-testing/looks-same).

## Getting Started
Start by installing the NPM package:
```
yarn add --dev cypress-looks-same
```

In your `cypress/plugins/index.js` file, add:
```js
const addLooksSamePlugin = require('cypress-looks-same/plugin');

module.exports = (on, config) => {
    addLooksSamePlugin(on, config);
};
```

In your `cypress/support/index.js` file, add:
```js
import addLooksSameCommands from 'cypress-looks-same/commands';

addLooksSameCommands();
```

Then in your tests, you can do this:
```js
describe("stuff", () => {
    specify("element visuals", () => {
        cy.get('.my-element')
            .shouldLookSameAs('test image');
    });
});
```

The first time this runs, a `cypress/snapshots/TestFile.spec.js/element visuals - test image.png` file will be created. The next time it runs, another screenshot will be taken and compared to the existing snapshot.

If the screenshots look different, the assertion will fail and `actual` and `diff` files will be created next to the snapshot.

If the screenshots look the same, the assertion passes, and any `actual` and `diff` files are cleaned up. The original element is returned for chaining.

You can compare screenshots of the whole screen by not specifying a subject:
```js
cy.shouldLookSameAs('whole screen');
```

## Configuration
You can pass an options object in to `shouldLookSameAs` to customise the screenshot and image comparison:
```js
cy.shouldLookSameAs('image', { /* ...options */ });
```
You can specify any of the options made available by the [screenshot command](https://docs.cypress.io/api/commands/screenshot.html) or by [looks-same](https://github.com/gemini-testing/looks-same).

### Defaults
Rather than specifying the same options everywhere, you can set defaults by passing them in to the `addLooksSameCommands()` call in your support file.

### Environment variables
Two environment variables are made available:

Variable                   | Description
---------------------------|------------
updateImageSnapshots       | When set to `true`, snapshots will be updated instead of comparing against them.
continueWhenLooksDifferent | When set to `true`, tests will continue running even when screenshots don't match existing snapshots. This makes it easy find all the mismatches in one run.

### Extras
There is also a `compareWithImageSnapshot` command, which does the same thing as `shouldLookSameAs`, but returns the comparison results instead of asserting on them. The results have the following properties:

Property        | Description
----------------|------------
imagesMatch     | `true` if a snapshot exists and matches the new screenshot. `false` if the snapshot is updated, or it doesn't look the same.
snapshotUpdated | `true` if the snapshot image was created or updated.
snapshot        | Path to the snapshot image.
actual          | Path to the `actual` image, if one was created.
diff            | Path to the `diff` image, if one was created.

## Caveats
To make `shouldLookSameAs` behave like a normal assertion, I've had to use undocumented Cypress features. Be aware that this plugin could stop working after any update to Cypress.