describe("hx-include attribute", function() {
  beforeEach(function () {
    clearWorkArea();
  });
  afterEach(function () {
    fetchMock.restore()
    clearWorkArea();
  });

  it('By default an input includes itself', async () => {
    // fetchMock.post({ url: '/include', body: 'i1=test' }, 'Clicked!')
    fetchMock.post((url, options) => {
      return url === '/include' && options.body === 'i1=test'
    }, 'Clicked!')
    var div = make('<div hx-target="this"><input hx-post="/include" hx-trigger="click" id="i1" name="i1" value="test"/></div>')
    var input = byId("i1")
    input.click();
    await fetchMock.flush(true)
    div.innerHTML.should.equal("Clicked!");
  });

  it('By default an input includes itself w/ data-* prefix', async () => {
    fetchMock.post((url, options) => {
      return url === '/include' && options.body === 'i1=test'
    }, 'Clicked!')
    var div = make('<div data-hx-target="this"><input hx-post="/include" data-hx-trigger="click" id="i1" name="i1" value="test"/></div>')
    var input = byId("i1")
    input.click();
    await fetchMock.flush(true)
    div.innerHTML.should.equal("Clicked!");
  });

  it('non-GET includes data from closest form', async () => {
    fetchMock.post((url, options) => {
      return url === '/include' && options.body === 'i1=test'
    }, 'Clicked!')
    var div = make('<form hx-target="this"><div id="d1" hx-post="/include"></div><input name="i1" value="test"/></form>')
    var input = byId("d1")
    input.click();
    await fetchMock.flush(true)
    div.innerHTML.should.equal("Clicked!");
  });

  it('non-GET includes data from closest form and nothing outside of it', async () => {
    fetchMock.post((url, options) => {
      return url === '/include' && options.body === 'i1=test'
    }, 'Clicked!')
    var div = make(`
      <div hx-include="*" hx-target="this">
        <input name="i1" value="before"/>
        <form><div id="d1" hx-post="/include"></div><input name="i1" value="test"/></form>
        <input name="i1" value="after"/>
      </div>
    `)
    var input = byId("d1")
    input.click();
    await fetchMock.flush(true)
    div.innerHTML.should.equal("Clicked!");
  });

  it('GET does not include closest form by default', async () => {
    fetchMock.get((url, options) => {
      return url === '/include' && !options.body
    }, 'Clicked!')
    var div = make('<form hx-target="this"><div id="d1" hx-get="/include"></div><input name="i1" value="test"/></form>')
    var input = byId("d1")
    input.click();
    await fetchMock.flush(true)
    div.innerHTML.should.equal("Clicked!");
  });

  it('An input is not included twice when it has hx-post and it is in a form', async () => {
    fetchMock.post((url, options) => {
      return url === '/include' && options.body === 'i1=test'
    }, 'Clicked!')
    var div = make('<form hx-target="this"><input hx-post="/include" hx-trigger="click" id="i1" name="i1" value="test"/></form>')
    var input = byId("i1")
    input.click();
    await fetchMock.flush(true)
    div.innerHTML.should.equal("Clicked!");
  });

  it('Two inputs are included twice when they have the same name', async () => {
    fetchMock.post((url, options) => {
      return url === '/include' && options.body === 'i1=test&i1=test2'
    }, 'Clicked!')
    var div = make(`
      <div hx-include="*" hx-target="this">
        <input hx-post="/include" hx-trigger="click" id="i1" name="i1" value="test"/>
        <input name="i1" value="test2"/>
      </div>
    `)
    var input = byId("i1")
    input.click();
    await fetchMock.flush(true)
    div.innerHTML.should.equal("Clicked!");
  });

  it('Two form inputs are included twice when they have the same name', async () => {
    fetchMock.post((url, options) => {
      return url === '/include' && options.body === 'i1=test&i1=test2'
    }, 'Clicked!')
    var div = make(`
      <form hx-target="this">
        <input hx-post="/include" hx-trigger="click" id="i1" name="i1" value="test"/>
        <input name="i1" value="test2"/>
      </form>
    `)
    var input = byId("i1")
    input.click();
    await fetchMock.flush(true)
    div.innerHTML.should.equal("Clicked!");
  });

  it('Input not included twice when it explicitly refers to parent form', async () => {
    fetchMock.post((url, options) => {
      return url === '/include' && options.body === 'i1=test'
    }, 'Clicked!')
    var div = make(`
      <form id="f1" hx-target="this">
        <input hx-include="#f1" hx-post="/include" hx-trigger="click" id="i1" name="i1" value="test"/>
      </form>
    `)
    var input = byId("i1")
    input.click();
    await fetchMock.flush(true)
    div.innerHTML.should.equal("Clicked!");
  });

  it('Input can be referred to externally', async () => {
    fetchMock.post((url, options) => {
      return url === '/include' && options.body === 'i1=test'
    }, 'Clicked!')
    make('<input id="i1" name="i1" value="test"/>');
    var div = make('<div hx-post="/include" hx-include="#i1"></div>')
    div.click();
    await fetchMock.flush(true)
    div.innerHTML.should.equal("Clicked!");
  });

  it('Two inputs can be referred to externally', async () => {
    fetchMock.post((url, options) => {
      return url === '/include' && options.body === 'i1=test&i2=test'
    }, 'Clicked!')
    make('<input id="i1" name="i1" value="test"/>');
    make('<input id="i2" name="i2" value="test"/>');
    var div = make('<div hx-post="/include" hx-include="#i1, #i2"></div>')
    div.click();
    await fetchMock.flush(true)
    div.innerHTML.should.equal("Clicked!");
  });

  it('A form can be referred to externally', async () => {
    fetchMock.post((url, options) => {
      return url === '/include' && options.body === 'i1=test&i2=test'
    }, 'Clicked!')
    make(`
      <form id="f1">
        <input name="i1" value="test"/>
        <input  name="i2" value="test"/>
      </form>
    `)
    var div = make('<div hx-post="/include" hx-include="#f1"></div>')
    div.click();
    await fetchMock.flush(true)
    div.innerHTML.should.equal("Clicked!");
  });

  it('If the element is not includeable, its descendant inputs are included', async () => {
    fetchMock.post((url, options) => {
      return url === '/include' && options.body === 'i1=test&i2=test'
    }, 'Clicked!')
    make(`
      <div id="i">
        <input name="i1" value="test"/>
        <input name="i2" value="test"/>
      </div>
    `)
    var div = make('<div hx-post="/include" hx-include="#i"></div>')
    div.click();
    await fetchMock.flush(true)
    div.innerHTML.should.equal("Clicked!");
  })

  it('The `closest` modifier can be used in the hx-include selector', async () => {
    fetchMock.post((url, options) => {
      return url === '/include' && options.body === 'i1=test&i2=test'
    }, 'Clicked!')
    make('<div id="i"><input name="i1" value="test"/><input name="i2" value="test"/>'+
      '<button id="btn" hx-post="/include" hx-include="closest div"></button></div>');
    var btn = byId('btn')
    btn.click();
    await fetchMock.flush(true)
    btn.innerHTML.should.equal("Clicked!");
  })

  it('The `this` modifier can be used in the hx-include selector', async () => {
    fetchMock.post((url, options) => {
      return url === '/include' && options.body === 'i1=test&i2=test'
    }, 'Clicked!')
    make(`
      <div id="i" hx-include="this">
        <input name="i1" value="test"/>
        <input name="i2" value="test"/>
        <button id="btn" hx-post="/include"></button>
      </div>
    `)
    var btn = byId('btn')
    btn.click();
    await fetchMock.flush(true)
    btn.innerHTML.should.equal("Clicked!");
  })

});
