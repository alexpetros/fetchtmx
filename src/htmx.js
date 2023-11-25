const config = {
  getCacheBusterParam: false
}

const htmx = {
  defineExtension: () => {},
  config,
  process,
}

const primaryAttributes = ['hx-get', 'hx-post', 'hx-delete', 'hx-put', 'hx-patch']

function addPrimary(element, method) {
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
    const elementsToSubmit = document.querySelectorAll(`${includeSelector}`)
    elementsToSubmit.forEach(e => {
      const name = e.getAttribute('name')
      const value = e.value
      if (name) formData.append(name, value)
    })
  }
  else if (hasValue) {
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
      const res = await fetch(route, { method, body })
      const text = await res.text()
      target.innerHTML = text
    } catch (error) {
      throw error
    }
  })

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

function hxVal(element, name, inherited = false) {
  const elementWithValue = inherited ? element.closest('[name]') : element
  return elementWithValue.getAttribute(name) || elementWithValue.getAttribute('data-' + name)
}

function process(element) {
  primaryAttributes.forEach((name) => {
    const [, method] = name.split('-')
    addPrimary(element, method)
  })
  for (let child of element.children) process(child)
}

function processAll() {
  const withData = [...primaryAttributes, ...primaryAttributes.map(name => 'data-' + name)]
  const methodQueryString = withData.map(name => `[${name}]`).join(',')
  const toProcess = document.querySelectorAll(methodQueryString)
  toProcess.forEach(process)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', processAll)
} else {
  processAll()
}

