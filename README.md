# fetchtmx
Spec-compatible rewrite of htmx with the Fetch API.

## Progress
55 TESTS PASSING

### Core Attributes
* [] hx-boost
* [x] hx-get
* [x] hx-post
* [] hx-on
* [] hx-push-url
* [] hx-select
* [] hx-select-oob
* [] hx-swap
* [] hx-swap-oob
* [] hx-target
* [] hx-trigger
* [] hx-vals

### Additional Attributes
* [] hx-confirm
* [x] hx-delete
* [] hx-disable
* [x] hx-disabled-elt
* [] hx-disinherit
* [] hx-encoding
* [] hx-ext
* [] hx-headers
* [] hx-history
* [] hx-history-elt
* [x] hx-include
* [] hx-indicator
* [] hx-params
* [x] hx-patch
* [] hx-preserve
* [] hx-prompt
* [x] hx-put
* [] hx-replace-url
* [] hx-request
* [] hx-sse
* [] hx-sync
* [] hx-validate
* [] hx-vars
* [] hx-ws

### Other Features
Some of these are more substantial than others, I will break them out eventually

* [] classes (`htmx-added`, `htmx-indicator`, etc.)
* [] request headers
* [] response headers
* [] events (limited compatibility here since `fetch` is a completely different API from XHR)
* [] JavaScript API
* [] config options


## How do I run it?
`npm i` to install the test dependencies, and then `open ./test/index.html`

## What is it?
fetchtmx is a spec-compatible rewrite of [htmx](https://htmx.org/). It will be fully compatible with
the existing htmx test suite (when loaded with an htmx compatibility extension). The main difference
is that it uses the much nicer `fetch()` API instead of `XMLHttpRequest`.

I'm also trying to see if it's possible to implement most of the functionality as an extension, so
that:

  * The extension mechanism might be enhanced.
  * Compatibility (and easy upgrades) can be maintained via extensions, while new users can take
    advantage of new defaults
  * Sometimes people tell me that htmx should be more extendable and I'd like to try and get a feel
    for exactly what that means.

## Why are you doing it?
I think it is an interesting challenge, and I'm learning a lot about htmx (which I am one of the
core maintainers for) by attempting to implement it myself.

I'm streaming the development on twitch at
[thefloatingcontinent](https://twitch.tv/thefloatingcontinent), which is something I've never done
before; that's also part of the challenge for me.

## Is this intended to compete with htmx?
No.

One thing that's very obvious when you try to do a spec-compatible rewrite of some software is that
the original software has the benefit (and scars) of having already resolved a thousand things you
didn't think of. This is mostly a humbling exercise in figuring out what those thing are, with
respect to htmx.

I don't even know if I'll finish it. It's a research project whose findings (if any) are
available for use by anyone, especially including bigskysoftware.

## What license is this available under?
BSD 2-Clause, same as htmx. The tests are based on the tests from the htmx and are being modified
for use in this project, under those terms. The `htmx.js` source file is my own, but licensed under the same terms.
