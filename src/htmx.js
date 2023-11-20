const config = {
  getCacheBusterParam: false
}

const htmx = {
  defineExtension: () => {},
  config,
  process,
}

const methods = ['get', 'post', 'delete', 'put', 'patch']

function addListener(element, method) {
  const attribRoute = element.getAttribute(`hx-${method}`) || element.getAttribute(`data-hx-${method}`)
  if (!attribRoute) return

  const isForm = element.tagName === 'FORM'
  const type = element.getAttribute('type')
  const isSubmitButton = element.tagName === 'BUTTON' &&
    (type === 'submit' || type === null)

  const baseTrigger = isForm ? 'submit' : 'click'
  const userTrigger = element.getAttribute('hx-trigger')
  const trigger = userTrigger || baseTrigger

  let route = attribRoute
  // monocle
  let [unpoundedUrl, anchorLink] = attribRoute.split('#', 2)
  anchorLink = anchorLink ? '#' + anchorLink : ''

  if (isForm) {
    const data = new FormData(element)
    const params = new URLSearchParams(data)
    // Preserve the query parameters in the attribRoute, if any
    const [baseUrl, existingParams] = unpoundedUrl.split('?', 2)
    const firstParamString = existingParams ? existingParams + '&' : ''
    const secondParamString = params.toString()
    // Append the new parameters to the existing ones
    route = baseUrl + '?' + firstParamString + secondParamString
  }

  if (htmx.config.getCacheBusterParam) {
    const glueString = route.includes('?') ? '&' : '?'
    const value = element.getAttribute('id') || 'true'
    route += glueString + `org.htmx.cache-buster=${value}`
  }

  // When adding core attributes, don't allow the document to submit a form
  if (isForm) {
    element.addEventListener('submit', (e) => e.preventDefault())
  } else if (isSubmitButton) {
    const closestForm = element.closest('form')
    if (closestForm) closestForm.addEventListener('submit', e => e.preventDefault())
  }

  // Add back the anchor link if there was one
  route += anchorLink

  element.addEventListener(trigger, async () => {
    try {
      const res = await fetch(route, { method })
      const text = await res.text()
      element.innerHTML = text
    } catch (error) {
      throw error
    }
  })

}

function process(element) {
  methods.forEach((method) => addListener(element, method))
  for (let child of element.children) process(child)
}

function processAll () {
  const toProcess = document.querySelectorAll('[hx-get]')
  toProcess.forEach(process)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', processAll)
} else {
  processAll()
}

