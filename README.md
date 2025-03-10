# source-inspector

[![License][license-image]][license-url]

Note: This extension currently only supports desktop devices using Chrome or
Chromium derivatives, such as Edge.

## Motivation

If you're a developer who ever needs to debug something within their browser,
DevTools is probably the most popular debugger, as it's shipped with Chrome.
It's a great resource, as are the many open-source alternatives. However, these
debuggers all rely on the browser's native debugger. Some very smart people have
figured out ways to detect when a debugger has been attached to their site,
whether through the web page debugger or through the browser extension debugger.

Enter `source-inspector`. We attempt to circumvent detection, so that you can
safely view the live HTML source of even the sketchiest websites. This tool is
intended to let you create a browser extension for any website, whether it's
rendered in HTML or XHTML.

## Privacy and Security

This extension does not record any data. In the future, we plan to possibly add
an options menu. This will be the extent of data collected, (i.e, yes/no), and
it will not be sent or broadcast anywhere. We also do not colect browser
history. We will **never** share any data with anyone, not even ourselves.
We believe that open source comprises source transparency and user privacy.
Your data is yours and yours alone, and we plan to keep it that way.

For more technical readers with a knowledge of browser extensions, the manifest
file shows the following:

- We do not have any web accessible resources, except for the manifest itself,
  which is outside of any extension's control.
- Running the extension in normal or incognito mode uses separate processes and
  separate memory. This means the extension in one mode cannot communicate
  with- or access any data from- the other. In other words, our extension
  respects incognito mode.
- This extension uses minimal permissions for security purposes.
- DevTools or any external debugger is not used. We wrote ours from scratch
  using plain JavaScript inspection and messaging.
- We don't use any host permissions. Instead, we only perform anything on the
  active tab upon user initiation.

There are also some additional security features we have implemented:

- Content scripts are injected in an isolated world and never modify the DOM.
  This prevents detection while still allowing access to the DOM.
<!--
- All messages are validated to ensure that no part of the extension has been
  [compromised](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/docs/security/compromised-renderers.md#Messaging).
-->

Finally, for transparency's sake, yes, the initial commit added *a lot*. That's
because this project had been in the works for a while. This was a rich
opportunity to learn about React and more technical (X)HTML, such as CDATA
sections. And in learning about React through this project, it was done over a
few times to get the nesting of diverse component states functional and
implemented to reasonable coding standards.

## Installing

This extension is not available on any browser web store, such as the Chrome
or Firefox web store.

## Changing Permissions

Either:

- Right click the extension icon in the extension toolbar
- Click "Manage extension"

or

- In the address bar, type `chrome://extensions` and hit enter
- Look for this extension and click `Details`

This is the extension details page. From here, you can toggle the extension's
permissions to run in incognito.

## How It Works

If you want evidence towards our claim of being "undetectable", or you're
curious about the project's inner workings, this is the section for you.

This extension is divided into three parts:

### Popup

When you click on the extension icon, the popup is the source inspection tab
that opens.

### Background

This is the internal event handler for any protected extension functions, such
as opening the popup. It also passes events between the popup and content
script.

### Content Script

This is a script that's "injected" into the page you're attempting to inspect.
Basically, it's run alongside the page and has access to the page's source.
If our extension wasn't trying to be undetectable, we could use this to modify
the page, such as with ad blocking.

## Caveats

- This extension is subject to the same restrictions as any extension. That
  means that protected URLs, such as `chrome://`, `edge://`,
  `chrome-extension://` and `about://`, cannot be inspected. Ironically, this
  means that you can't inspect the extension's own source code.
- Due to how browsers render XML documents that don't have attached stylesheets,
  XML is only partially supported. If the XML document is styled, then it
  should be fully supported. However, many modern browsers may add some
  boilerplate to the rendered document to say that there's no stylesheet.
  Because of how this extension works and the restrictions we apply to it for
  the user's sake, this will be included in the inspected source. In other
  words, if you can see it, so can this extension.
- If we were to publish this extension to the Chrome or Firefox web stores,
  this extension would unfortunately cease to be undetectable. Publishing would
  result in the extension being associated with a fixed extension ID, which
  would then allow websites to detect the extension. There is nothing any
  browser extension can do to cicrumvent this. Some examples:
  - In Chrome, a website could send a GET request to
    `chrome-extension://<YOUR_ID_HERE>/manifest.json`. If it's successful, you
    have our extension installed.
  - In Firefox, by clicking the extension button and activating the inspector,
    the website can look at its
    [origin header](https://bugzilla.mozilla.org/show_bug.cgi?id=1405971)
    and determine that you're trying to use our extension.

## Contribution

For a list of known issues and planned features, see the [TODOs](TODO.md)

## Credits

- My own [extension boilerplate](https://github.com/Anonymous-Humanoid/chromium-extension-boilerplate)
- [Code review icons](https://www.flaticon.com/free-icons/code-review) created
by Freepik - Flaticon

[license-image]: https://img.shields.io/npm/l/markdownlint.svg
[license-url]: https://opensource.org/licenses/MIT
