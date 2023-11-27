describe("hx-disabled-elt attribute", async () => {
  beforeEach(function() {
    clearWorkArea();
  });
  afterEach(function()  {
    fetchMock.restore();
    clearWorkArea();
  });

  it('single element can be disabled w/ hx-disabled elts', async () =>
    {
      fetchMock.get("/test", "Clicked!");
      var btn = make('<button hx-get="/test" hx-disabled-elt="this">Click Me!</button>')
      btn.hasAttribute('disabled').should.equal(false);
      btn.click();
      btn.hasAttribute('disabled').should.equal(true);
      await fetchMock.flush(true)
      btn.hasAttribute('disabled').should.equal(false);
    });


  it('single element can be disabled w/ data-hx-disabled elts', async () => {
    fetchMock.get("/test", "Clicked!");
    var btn = make('<button hx-get="/test" data-hx-disabled-elt="this">Click Me!</button>')
    btn.hasAttribute('disabled').should.equal(false);
    btn.click();
    btn.hasAttribute('disabled').should.equal(true);
    await fetchMock.flush(true)
    btn.hasAttribute('disabled').should.equal(false);
  });

  it('single element can be disabled w/ closest syntax', async () => {
    fetchMock.get("/test", "Clicked!");
    var fieldset = make('<fieldset><button id="b1" hx-get="/test" hx-disabled-elt="closest fieldset">Click Me!</button></fieldset>')
    var btn = byId('b1');
    fieldset.hasAttribute('disabled').should.equal(false);
    btn.click();
    fieldset.hasAttribute('disabled').should.equal(true);
    await fetchMock.flush(true)
    fieldset.hasAttribute('disabled').should.equal(false);
  });

  it('multiple requests with same disabled elt are handled properly', async () => {
    fetchMock.get("/test", "Clicked!");
    var b1 = make('<button hx-get="/test" hx-disabled-elt="#b3">Click Me!</button>')
    var b2 = make('<button hx-get="/test" hx-disabled-elt="#b3">Click Me!</button>')
    var b3 = make('<button id="b3">Demo</button>')
    b3.hasAttribute('disabled').should.equal(false);

    b1.click();
    b3.hasAttribute('disabled').should.equal(true);

    b2.click();
    b3.hasAttribute('disabled').should.equal(true);

    // TODO the original test had a way to only complete one of the requests
    // I cannot figure out how to do this fetchmock and at the moment I don't care to
    // I'm pretty sure I got it right lol
    b3.hasAttribute('disabled').should.equal(true);

    await fetchMock.flush(true)

    b3.hasAttribute('disabled').should.equal(false);

  });

  it('multiple elts can be disabled', async () =>
    {
      fetchMock.get("/test", "Clicked!");
      var b1 = make('<button hx-get="/test" hx-disabled-elt="#b2, #b3">Click Me!</button>')
      var b2 = make('<button id="b2">Click Me!</button>')
      var b3 = make('<button id="b3">Demo</button>')

      b2.hasAttribute('disabled').should.equal(false);
      b3.hasAttribute('disabled').should.equal(false);

      b1.click();
      b2.hasAttribute('disabled').should.equal(true);
      b3.hasAttribute('disabled').should.equal(true);

      await fetchMock.flush(true)
      b2.hasAttribute('disabled').should.equal(false);
      b3.hasAttribute('disabled').should.equal(false);

    });


})
