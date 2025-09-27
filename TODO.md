# TODOs

## Functional Priorities

- StateManager needs to process multiple messages per render, defer rendering,
  or decouple the renderer (`setState`) to avoid
  `Uncaught Error: Too many re-renders. React limits the number of renders`
  `to prevent an infinite loop` on complex websites.
  Note: temporarily patched by a horrible hack in 27ec48ab57cdf1182c9190985ce78db7562606e8
- Add Firefox extension support,
  see: [signing](https://extensionworkshop.com/documentation/publish/)
- Write `README.md`
  - How it Works section
- Add dropdown functionality to all nodes with children
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
- Add documentation where it's missing or necessary (e.g, @param or @template)
- Support character data mutations
- Finish supporting all applicable node types
  - Test nested document nodes (see: [SO](https://stackoverflow.com/questions/26010355/is-there-a-way-to-uniquely-identify-an-iframe-that-the-content-script-runs-in-fo))
  - Shadow roots can be accessed using
    [`chrome.dom.openOrClosedShadowRoot`](https://developer.chrome.com/docs/extensions/reference/api/dom?hl=en#method-openOrClosedShadowRoot)
- [Validate](https://validator.w3.org) sample inspector pages
  conform to a11y standards

## Technical Priorities

- Rethink debug view (possibly a test-id field?)
- For a11y purposes, add the ability
  to select and navigate between elements in the inspector
- Add an [error boundary](https://react.dev/link/error-boundaries)
  for improved debugging UX
- Move top-level configuration files to their own folder
- Migrate ChildManager to a
  [reducer](https://react.dev/learn/extracting-state-logic-into-a-reducer)
  for increased maintainability
- Configure ESLint:
  - Ensure ESLint config file path is correctly recognized and interpreted
  - Replace Prettier formatting with ESLint to resolve rule conflicts
- Add a light mode toggle

## Backlog Priorities

- Tell the user when a protected page cannot be inspected
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
- [Internationalize](https://developer.chrome.com/docs/extensions/reference/api/i18n)
- If project scope allows it, add an options page to allow the content script
  to be automatically reinjected on page or tab (re)load
- If project scope allows it, add a network request viewer
- If the project scope allows it, install the dependencies necessary
  for Webhint and its .hintrc config file and resolve any vulnerabilities
