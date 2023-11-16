describe("hx-get attribute", function() {
  beforeEach(() => {
    clearWorkArea()
  });
  afterEach(() => {
    fetchMock.restore()
    clearWorkArea()
  });

  it('issues a GET request on click and swaps content', async () => {
    fetchMock.get("/test", 'Clicked!')

    var btn = make('<button hx-get="/test">Click Me!</button>')
    btn.click()
    await fetchMock.flush(true)
    btn.innerHTML.should.equal("Clicked!")
  });

  it('GET does not include surrounding data by default', async () => {
    fetchMock.get('/test', 'Clicked!')
    make('<form><input name="i1" value="value"/><button id="b1" hx-get="/test">Click Me!</button></form>')
    var btn = byId("b1")
    btn.click()
    await fetchMock.flush(true)
    btn.innerHTML.should.equal("Clicked!")
  });

  it('GET on form includes its own data by default', async () => {
    fetchMock.get('/test?i1=value', 'Clicked!')
    var form = make('<form hx-trigger="click" hx-get="/test"><input name="i1" value="value"/><button id="b1">Click Me!</button></form>')
    form.click()
    await fetchMock.flush(true)
    form.innerHTML.should.equal("Clicked!")
  });

  it('GET on form with existing parameters works properly', async () => {
    fetchMock.get('/test?foo=bar&i1=value', 'Clicked!')

    var form = make('<form hx-trigger="click" hx-get="/test?foo=bar"><input name="i1" value="value"/><button id="b1">Click Me!</button></form>')
    form.click()
    await fetchMock.flush(true)
    form.innerHTML.should.equal("Clicked!")
  });

  it('GET on form with anchor link in URL works properly', async () => {
    fetchMock.get('/test?foo=bar&i1=value#foo', 'Clicked!')
    var form = make('<form hx-trigger="click" hx-get="/test?foo=bar#foo"><input name="i1" value="value"/><button id="b1">Click Me!</button></form>');
    form.click();
    await fetchMock.flush(true)
    form.innerHTML.should.equal("Clicked!");
  });


  it('issues a GET request on click and swaps content w/ data-* prefix', async () => {
    fetchMock.get('/test', 'Clicked!')
    var btn = make('<button data-hx-get="/test">Click Me!</button>')
    btn.click();
    await fetchMock.flush(true)
    btn.innerHTML.should.equal("Clicked!");
  });

  it('does not include a cache-busting parameter when not enabled', async () => {
    fetchMock.get('/test', 'Clicked!')

    try {
      htmx.config.getCacheBusterParam = false;
      var btn = make('<button hx-get="/test">Click Me!</button>')
      btn.click();
      await fetchMock.flush(true)
      btn.innerHTML.should.equal("Clicked!");
    } finally {
      htmx.config.getCacheBusterParam = false;
    }
  });

  it('includes a cache-busting parameter when enabled w/ value "true" if no id on target', async () => {

    fetchMock.get('/test?org.htmx.cache-buster=true', 'Clicked!')

    try {
      htmx.config.getCacheBusterParam = true;
      var btn = make('<button hx-get="/test">Click Me!</button>')
      btn.click();
      await fetchMock.flush(true)
      btn.innerHTML.should.equal("Clicked!");
    } finally {
      htmx.config.getCacheBusterParam = false;
    }
  });

  it('includes a cache-busting parameter when enabled w/ the id of the target if there is one', async () => {
    fetchMock.get('/test?org.htmx.cache-buster=foo', 'Clicked!')

    try {
      htmx.config.getCacheBusterParam = true;
      var btn = make('<button hx-get="/test" id="foo">Click Me!</button>')
      btn.click();
      await fetchMock.flush(true)
      btn.innerHTML.should.equal("Clicked!");
    } finally {
      htmx.config.getCacheBusterParam = false;
    }
  });
});
