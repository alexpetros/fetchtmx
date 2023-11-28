const config = {
  getCacheBusterParam: false
}

const htmx = {
  defineExtension: () => {},
  config,
  process,
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
      const responseText = await res.text()

      const swapStyle = hxVal(element, 'hx-swap')
      performSwap(target, swapStyle, responseText)

      if (elementsToDisable) elementsToDisable.map(decrementDisabled)
    } catch (error) {
      throw error
    }
  })
}

function performSwap (element, swapStyle, html) {

  switch (swapStyle) {
    case 'beforebegin': {
      element.insertAdjacentHTML('beforebegin', html)
      const newElement = element.previousSibling
      process(newElement)
      break
    }
    case 'outerHTML': {
      element.insertAdjacentHTML('beforebegin', html)
      // previousSibling INCLUDES text nodes so in theory this does what I want
      const newElement = element.previousSibling
      process(newElement)
      element.remove()
      break
    }
    case 'innerHTML':
    default:
      element.innerHTML = html
      process(element)
  }
}

function process(element) {
  console.log(element)
  primaryAttributes.forEach((name) => {
    const [, method] = name.split('-')
    addPrimaryListener(element, method)
  })
  for (let child of element.children) process(child)
}

function processAll() {
  const withData = [...primaryAttributes, ...primaryAttributes.map(name => 'data-' + name)]
  const methodQueryString = withData.map(name => `[${name}]`).join(',')
  const toProcess = document.querySelectorAll(methodQueryString)
  toProcess.forEach(process)
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

