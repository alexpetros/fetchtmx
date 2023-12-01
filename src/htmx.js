const config = {
  getCacheBusterParam: false,
  defaultSwapStyle: 'innerHTML' // I maybe want to change this
}

const htmx = {
  defineExtension: () => {},
  config,
  process,
}

function processAll() {
  const withData = [...primaryAttributes, ...primaryAttributes.map(name => 'data-' + name)]
  const methodQueryString = withData.map(name => `[${name}]`).join(',')
  const toProcess = document.querySelectorAll(methodQueryString)
  toProcess.forEach(process)
}

function process(element) {
  // Sometimes we insert + process nodes that are just text
  if (element.nodeName === '#text') return

  primaryAttributes.forEach((name) => {
    const [, method] = name.split('-')
    addPrimaryListener(element, method)
  })
  for (let child of element.children) process(child)
}

const primaryAttributes = ['hx-get', 'hx-post', 'hx-delete', 'hx-put', 'hx-patch']

function addPrimaryListener(element, method) {
  const attribRoute = hxVal(element, `hx-${method}`)
  if (!attribRoute) return

  const { tagName } = element
  const isForm = tagName === 'FORM'
  const type = hxVal(element, 'type')
  const isSubmitButton = tagName === 'BUTTON' && (type === 'submit' || type === null)

  const hasValue = tagName === 'INPUT' || tagName === 'SELECT'

  const baseTrigger = isForm ? 'submit' : 'click'
  const userTrigger = hxVal(element, 'hx-trigger')
  const trigger = userTrigger || baseTrigger

  let route = attribRoute
  let body = undefined

  // monocle
  let [unpoundedUrl, anchorLink] = attribRoute.split('#', 2)
  anchorLink = anchorLink ? '#' + anchorLink : ''

  // If there is data associated with the request, collect it
  let formData = new FormData()
  const closestForm = element.closest('form') || undefined
  const closestInclude = element.closest('[hx-include]') || undefined
  if (isForm) {
    formData = new FormData(element)
  } else if (closestForm) {
    // [EXT] I don't really like the implicit inclusion of form data on hx-[!get] inside forms
    if (method !== 'get') formData = new FormData(closestForm)
  } else if (closestInclude) {
    const includeSelector = hxVal(closestInclude, 'hx-include')

    // In the case of hx-include, "this" means the element that the property was defined on,
    // not the element that inherited it. This is the opposite of how "closest" and "find" behave.
    const elementsToSubmit = includeSelector === 'this' ?
      closestInclude.querySelectorAll('*') :
      eQuerySelectorAll(element, `${includeSelector}`)
    const processed = new Set()
    elementsToSubmit.forEach(e => { includeElement(e, formData, processed) })
  } else if (hasValue) {
    const name = element.getAttribute('name')
    const value = element.value
    formData.append(name, value)
  }

  // If there is a request payload, add it to the appropriate part of the request
  const hasData = formData.entries().next().done !== true
  if (hasData) {
    if (method === 'get' || method === 'delete') {
      route = appendQueryParams(unpoundedUrl, formData)
    } else {
      body = (new URLSearchParams(formData)).toString()
    }
  }

  if (htmx.config.getCacheBusterParam) {
    const glueString = route.includes('?') ? '&' : '?'
    const value = hxVal(element, 'id') || 'true'
    route += glueString + `org.htmx.cache-buster=${value}`
  }

  // Add back the anchor link if there was one
  route += anchorLink

  // If the element is a form or a button that submits a form, prevent the submission
  if (isForm) {
    element.addEventListener('submit', (e) => e.preventDefault())
  } else if (isSubmitButton) {
    const closestForm = element.closest('form')
    if (closestForm) closestForm.addEventListener('submit', e => e.preventDefault())
  }

  const inheritedTarget = element.closest('[hx-target=this]') || element.closest('[data-hx-target=this]')
  const target = inheritedTarget || element

  element.addEventListener(trigger, async () => {
    try {
      const request = fetch(route, { method, body })

      const disabledEltsQuery = hxVal(element, 'hx-disabled-elt', true)
      const elementsToDisable = disabledEltsQuery && eQuerySelectorAll(element, disabledEltsQuery)

      if (elementsToDisable) elementsToDisable.map(incrementDisabled)

      const res = await request
      const html = await res.text()

      const swapStyle = hxVal(element, 'hx-swap')
      await performSwap(target, swapStyle, html)

      if (elementsToDisable) elementsToDisable.map(decrementDisabled)
    } catch (error) {
      throw error
    }
  })
}

const SWAP_MODIFIERS = ['transition', 'swap', 'settle', 'ignoreTitle', 'scroll', 'show']
async function performSwap (target, swapString, html) {

  const tokens = swapString?.split(' ') || ''
  const swapStyle = tokens[0]
  const modifierTokens = tokens.slice(1) || []

  const modifiers = modifierTokens.reduce((accum, current) => {
    const [name, value] = current.split(':')
    if (!SWAP_MODIFIERS.includes(name)) {
      console.error(`Unknown swap token ${name}`)
    } else {
      accum[name] = value || true
    }
    return accum

  }, {})

  const swapFunc = parseSwapStyle(swapStyle) || parseSwapStyle(htmx.config.defaultSwapStyle)
  if (modifiers.swap) await sleep((modifiers.swap))
  swapFunc(target, html)
  if (modifiers.settle) await sleep(parseTimeInterval(modifiers.settle))
}


function swapBeforeBegin (element, html) {
  element.insertAdjacentHTML('beforebegin', html)
  const newElement = element.previousSibling
  process(newElement)
}

function swapAfterBegin(element, html) {
  element.insertAdjacentHTML('afterbegin', html)
  const newElement = element.firstChild
  process(newElement)
}

function swapBeforeEnd(element, html) {
  element.insertAdjacentHTML('beforeend', html)
  const newElement = element.lastChild
  process(newElement)
}

function swapAfterEnd(element, html) {
  element.insertAdjacentHTML('afterend', html)
  const newElement = element.nextSibling
  process(newElement)
}

function swapOuterHTML(element, html) {
  element.insertAdjacentHTML('beforebegin', html)
  // previousSibling INCLUDES text nodes so in theory this does what I want
  const newElement = element.previousSibling
  process(newElement)
  element.remove()
}

function swapInnnerHTML(element, html) {
  element.innerHTML = html
  process(element)
}

function parseSwapStyle(swapStyle) {
  if (!swapStyle) return undefined

  switch (swapStyle) {
    case 'beforebegin':
      return swapBeforeBegin
    case 'afterbegin':
      return swapAfterBegin;
    case 'beforeend':
      return swapBeforeEnd
    case 'afterend':
      return swapAfterEnd
    case 'none':
      return () => {}
    case 'delete':
      return (e) => e.remove()
    case 'outerHTML':
      return swapOuterHTML
    case 'innerHTML':
      return swapInnnerHTML
    default:
      return undefined
  }
}

function eQuerySelectorAll(element, eSelector) {
  const [modifier, selector] = eSelector.split(' ')

  // "this" is not currently implemented here because "this" has different dehavior in context
  switch(modifier) {
    case 'this':
      return [element]
    case 'closest':
      return [element.closest(selector)]
    case 'find':
      return [element.querySelector(selector)]
    default:
      return Array.from(document.querySelectorAll(eSelector))
  }
}

function incrementDisabled(element) {
  const count = element.hxDisabledCount || 0
  if (!count) {
    element.setAttribute('disabled', 'true')
  }

  element.hxDisabledCount = count + 1
}

function decrementDisabled(element) {
  const count = element.hxDisabledCount || 0
  if (count > 1) {
    element.hxDisabledCount = count - 1
  } else {
    element.removeAttribute('disabled')
  }
}

/**
 * Safely append new query parameters to a route.
 * Method assumes that there is no anchor link (#)
 */
function appendQueryParams(route, formData) {
    const params = new URLSearchParams(formData)
    // Preserve the query parameters in the attribRoute, if any
    const [baseUrl, existingParams] = route.split('?', 2)
    const firstParamString = existingParams ? existingParams + '&' : ''
    const secondParamString = params.toString()
    // Append the new parameters to the existing ones
    return baseUrl + '?' + firstParamString + secondParamString
}

function includeElement(e, formData, processed) {
  if (processed.has(e)) return

  processed.add(e)
  if (e.tagName === 'FORM') {
    formData.merge(new FormData(e))
    return
  }
  const name = e.getAttribute('name')
  const value = e.value
  if (name && value) {
    formData.append(name, value)
  } else {
    for (const child of e.children) {
      includeElement(child, formData, processed)
    }
  }
}

function hxVal(element, name, inherited = false) {
  let e = element
  if (inherited) {
    e = element.closest(`[${name}], [data-${name}]`) || element
  }

  return e.getAttribute(name) || e.getAttribute('data-' + name)
}

FormData.prototype.merge = function(other) {
  for (const [name, value] of other.entries()) {
    this.append(name,value)
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', processAll)
} else {
  processAll()
}

/**
 * Get a promise that resolves after the time in milliseconds has elapsed.
 *
 * You can combine this with async/await syntax to "wait" for a certain period of time the
 * sequential execution of your function. For instance:
 *   await sleep(3000)
 * will continue executing the function after 3 seconds.
 */
function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(() => resolve(), milliseconds))
}

function parseTimeInterval(str) {
  if (typeof str !== 'string') return NaN

  if (str.slice(-2) === 'ms') {
    return parseFloat(str.slice(0, -2))
  } else if (str.slice(-1) === 's') {
    return parseFloat(str.slice(0, -1)) * 1000
  } else if (str.slice(-1) === 'm') {
    return parseFloat(str.slice(0, -1)) * 1000 * 60
  } else {
    return NaN
  }
}
