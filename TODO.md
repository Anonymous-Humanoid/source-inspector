# TODOs

## Functional Priorities

- Remove `chrome.d.ts` when
  [DefinitelyTyped PR #72170](https://github.com/DefinitelyTyped/DefinitelyTyped/pull/72170)
  is merged and published to prod
- Extension icon is not rendering in the extension toolbar
- For security reasons, validate all messages to ensure no compromisation
  has occurred within any untrustworthy part of the extension
  (see: the [issue tracker](https://issuetracker.google.com/issues/311491887)
  and the referenced
  [docs](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/docs/security/compromised-renderers.md#Messaging))
- Tell the user when it cannot inspect a protected page
- Replace host permissions with the active tab permission to minimize
  permissions
- Add documentation where it's missing or necessary (e.g, @param or @returns)
- Fix `ul` CSS
  - Remove unnecessary whitespace
  - Indent nested nodes
- Support attribute mutations
  - Have attributes and text referenced through an ID in virtual nodes instead
    of storing key-value pairs and regenerating keys by a fixed pattern
- Support character data mutations, if necessary
- Finish supporting all node types
  - Doctypes can have preceding sibling nodes (XHTML only)
  - Shadow roots can be accessed using
  [`chrome.dom.openOrClosedShadowRoot`](https://developer.chrome.com/docs/extensions/reference/api/dom?hl=en#method-openOrClosedShadowRoot)

## Technical Priorities

- Centralize all TODOs in this file
- Write `README.md`
  - Installing section
  - Changing Permissions section
  - How it Works section
- Move top-level configuration files to their own folder
- Migrate ChildManager to a
  [reducer](https://react.dev/learn/extracting-state-logic-into-a-reducer)
  for increased maintainability
- Only send ACKs from the StateManager when necessary
- ChildManager prop drills `nodes`:
  use a shared context to manage deep node state
- Format VS Code editor on save
- Ensure ESLint config file path is correctly recognized and interpreted
- Add a light mode:
  
  ```css
  :root {
      color-scheme: light dark;
      color: light-dark()
  }
  ```

## Future Priorities

- Create and add donation medium
- Migrate CommonJS config files to TypeScript by modifying the Nodemon configs
  and/or the package.json scripts
- Use TypeScript namespaces for code separation
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
    type DynamicTest = StaticTest | {
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
