# TODOs

## Functional Priorities

- Write `README.md`
  - How it Works section
- Add dropdown functionality to all nodes with children
- For accessibility purposes, add the ability
  to select and navigate between elements in the inspector
- When elements are added, children and text should be processed
- Fix duplicate attribute names when adding a second or more attributes
  to an element using DevTool's "Edit as HTML" function
  (possible race condition)
- Fix adding nodes with previous node IDs
  (e.g, removing a node in DevTools and then undoing the action)

- For security reasons, validate all messages to ensure no compromisation
  has occurred within any untrustworthy part of the extension
  (see: the [issue tracker](https://issuetracker.google.com/issues/311491887)
  and the referenced
  [docs](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/docs/security/compromised-renderers.md#Messaging))
- Tell the user when a protected page cannot be inspected
- Add documentation where it's missing or necessary (e.g, @param or @returns)
- Support character data mutations
- Finish supporting all applicable node types
  - Test nested document nodes (see: [SO](https://stackoverflow.com/questions/26010355/is-there-a-way-to-uniquely-identify-an-iframe-that-the-content-script-runs-in-fo))
  - Shadow roots can be accessed using
    [`chrome.dom.openOrClosedShadowRoot`](https://developer.chrome.com/docs/extensions/reference/api/dom?hl=en#method-openOrClosedShadowRoot)
- [Validate](https://validator.w3.org) all (X)HTML pages conform to standards

## Technical Priorities

- Add an [error boundary](https://react.dev/link/error-boundaries)
  for improved debugging UX
- StateManager needs to process multiple messages per render
  or defer rendering to avoid
  `Uncaught Error: Too many re-renders. React limits the number of renders`
  `to prevent an infinite loop` on complex websites
- Move top-level configuration files to their own folder
- Migrate ChildManager to a
  [reducer](https://react.dev/learn/extracting-state-logic-into-a-reducer)
  for increased maintainability
- ChildManager prop drills `nodes`:
  use a shared context and provider (in ChildManager) to manage deep node state
- Format VS Code editor on save with Prettier
- Configure ESLint:
  - Ensure ESLint config file path is correctly recognized and interpreted
- Add chromium-extension-boilerplate as an upstream repo dependency
- Add a light mode:

  ```css
  :root {
    color-scheme: light dark;
    color: light-dark();
  }
  ```

## Future Priorities

- Configure React source map generation
  (`React.createElement` statements are ugly)
- Create and add donation medium
- Modify ESLint config:

  - Currently using deprecated rules, see:
    [no-extra-semi](https://eslint.org/docs/latest/rules/no-extra-semi) and
    [default](https://eslint.style/packages/default)
  - Force semicolons in interfaces and types. I.e:

    ```ts
    interface StaticTest {
      id: 'Number'; // Interface member semis
      x: number;
    }
    type DynamicTest =
      | StaticTest
      | {
          id: 'String'; // Type member semis
          x: string;
        }; // Type semi
    ```

- Create Webpack aliases for background and content scripts, allowing Webpack
  to be seamlessly integrated where import and require cannot be used
  (i.e, script injection or manifest registering)
- Support Webpack chunking
- Add unit tests and end-to-end tests
- Add Firefox extension support (see: [signing](https://extensionworkshop.com/documentation/publish/))
- [Internationalize](https://developer.chrome.com/docs/extensions/reference/api/i18n)
- If project scope allows it, add an options page to allow the content script
  to be automatically reinjected on page or tab (re)load
- If project scope allows it, add a network request viewer
- If the project scope allows it, install the dependencies necessary for Webhint
  and its .hintrc config file and resolve any vulnerabilities
- If the project scope allows it, add more accessibility customization
