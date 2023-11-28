describe("hx-swap attribute", function(){
  beforeEach(function() {
    clearWorkArea();
  });
  afterEach(function()  {
    fetchMock.restore()
    clearWorkArea();
  });

  it('swap innerHTML properly', async () =>
    {
      fetchMock.get('/test', '<a hx-get="/test2">Click Me</a>');
      fetchMock.get("/test2", "Clicked!");

      var div = make('<div hx-get="/test"></div>')
      div.click();
      await fetchMock.flush(true)
      div.innerHTML.should.equal('<a hx-get="/test2">Click Me</a>');
      var a = div.querySelector('a');
      a.click();
      await fetchMock.flush(true)
      a.innerHTML.should.equal('Clicked!');
    });

  it('swap outerHTML properly', async () =>
    {
      fetchMock.get('/test', '<a id=a1 hx-get="/test2">Click Me</a>');
      fetchMock.get("/test2", "Clicked!");

      var div = make('<div id="d1" hx-get="/test" hx-swap="outerHTML"></div>')
      div.click();
      should.equal(byId("d1"), div);
      await fetchMock.flush(true)
      should.equal(byId("d1"), null);
      byId("a1").click();
      await fetchMock.flush(true)
      byId("a1").innerHTML.should.equal('Clicked!');
    });

  it('swap beforebegin properly', async () => {
      let i = 0;
      fetchMock.get("/test", async () => {
        i++
        const body = `<a id="a${i}" hx-get="/test2" hx-swap="innerHTML">${i}</a>`
        return { status: 200, body }
      })
      fetchMock.get("/test2", "*");

      var div = make('<div hx-get="/test" hx-swap="beforebegin">*</div>')
      var parent = div.parentElement;
      div.click();
      await fetchMock.flush(true)
      div.innerText.should.equal("*");
      removeWhiteSpace(parent.innerText).should.equal("1*");

      byId("a1").click();
      await fetchMock.flush(true)
      removeWhiteSpace(parent.innerText).should.equal("**");

      div.click();
      await fetchMock.flush(true)
      div.innerText.should.equal("*");
      removeWhiteSpace(parent.innerText).should.equal("*2*");

      byId("a2").click();
      await fetchMock.flush(true)
      removeWhiteSpace(parent.innerText).should.equal("***");
    });

  it('swap afterbegin properly', async () =>
    {
      var i = 0;
      this.server.respondWith("GET", "/test", function(xhr){
        i++;
        xhr.respond(200, {}, "" + i);
      });

      var div = make('<div hx-get="/test" hx-swap="afterbegin">*</div>')

      div.click();
      await fetchMock.flush(true)
      div.innerText.should.equal("1*");

      div.click();
      await fetchMock.flush(true)
      div.innerText.should.equal("21*");

      div.click();
      await fetchMock.flush(true)
      div.innerText.should.equal("321*");
    });

  it('swap afterbegin properly with no initial content', async () =>
    {
      var i = 0;
      this.server.respondWith("GET", "/test", function(xhr){
        i++;
        xhr.respond(200, {}, "" + i);
      });

      var div = make('<div hx-get="/test" hx-swap="afterbegin"></div>')

      div.click();
      await fetchMock.flush(true)
      div.innerText.should.equal("1");

      div.click();
      await fetchMock.flush(true)
      div.innerText.should.equal("21");

      div.click();
      await fetchMock.flush(true)
      div.innerText.should.equal("321");
    });

  it('swap afterend properly', async () =>
    {
      var i = 0;
      this.server.respondWith("GET", "/test", function(xhr){
        i++;
        xhr.respond(200, {}, '<a id="a' + i + '" hx-get="/test2" hx-swap="innerHTML">' + i + '</a>');
      });
      this.server.respondWith("GET", "/test2", "*");

      var div = make('<div hx-get="/test" hx-swap="afterend">*</div>')
      var parent = div.parentElement;
      div.click();
      await fetchMock.flush(true)
      div.innerText.should.equal("*");
      removeWhiteSpace(parent.innerText).should.equal("*1");

      byId("a1").click();
      await fetchMock.flush(true)
      removeWhiteSpace(parent.innerText).should.equal("**");

      div.click();
      await fetchMock.flush(true)
      div.innerText.should.equal("*");
      removeWhiteSpace(parent.innerText).should.equal("*2*");

      byId("a2").click();
      await fetchMock.flush(true)
      removeWhiteSpace(parent.innerText).should.equal("***");
    });

  it('handles beforeend properly', async () =>
    {
      var i = 0;
      this.server.respondWith("GET", "/test", function(xhr){
        i++;
        xhr.respond(200, {}, "" + i);
      });

      var div = make('<div hx-get="/test" hx-swap="beforeend">*</div>')

      div.click();
      await fetchMock.flush(true)
      div.innerText.should.equal("*1");

      div.click();
      await fetchMock.flush(true)
      div.innerText.should.equal("*12");

      div.click();
      await fetchMock.flush(true)
      div.innerText.should.equal("*123");
    });

  it('handles beforeend properly with no initial content', async () =>
    {
      var i = 0;
      this.server.respondWith("GET", "/test", function(xhr){
        i++;
        xhr.respond(200, {}, "" + i);
      });

      var div = make('<div hx-get="/test" hx-swap="beforeend"></div>')

      div.click();
      await fetchMock.flush(true)
      div.innerText.should.equal("1");

      div.click();
      await fetchMock.flush(true)
      div.innerText.should.equal("12");

      div.click();
      await fetchMock.flush(true)
      div.innerText.should.equal("123");
    });

  it('properly parses various swap specifications', async () =>{
    var swapSpec = htmx._("getSwapSpecification"); // internal function for swap spec
    swapSpec(make("<div/>")).swapStyle.should.equal("innerHTML")
    swapSpec(make("<div hx-swap='innerHTML'/>")).swapStyle.should.equal("innerHTML")
    swapSpec(make("<div hx-swap='innerHTML'/>")).swapDelay.should.equal(0)
    swapSpec(make("<div hx-swap='innerHTML'/>")).settleDelay.should.equal(0) // set to 0 in tests
    swapSpec(make("<div hx-swap='innerHTML swap:10'/>")).swapDelay.should.equal(10)
    swapSpec(make("<div hx-swap='innerHTML settle:10'/>")).settleDelay.should.equal(10)
    swapSpec(make("<div hx-swap='innerHTML swap:10 settle:11'/>")).swapDelay.should.equal(10)
    swapSpec(make("<div hx-swap='innerHTML swap:10 settle:11'/>")).settleDelay.should.equal(11)
    swapSpec(make("<div hx-swap='innerHTML settle:11 swap:10'/>")).swapDelay.should.equal(10)
    swapSpec(make("<div hx-swap='innerHTML settle:11 swap:10'/>")).settleDelay.should.equal(11)
    swapSpec(make("<div hx-swap='innerHTML nonsense settle:11 swap:10'/>")).settleDelay.should.equal(11)
    swapSpec(make("<div hx-swap='innerHTML   nonsense   settle:11   swap:10  '/>")).settleDelay.should.equal(11)

    swapSpec(make("<div hx-swap='swap:10'/>")).swapStyle.should.equal("innerHTML")
    swapSpec(make("<div hx-swap='swap:10'/>")).swapDelay.should.equal(10)

    swapSpec(make("<div hx-swap='settle:10'/>")).swapStyle.should.equal("innerHTML")
    swapSpec(make("<div hx-swap='settle:10'/>")).settleDelay.should.equal(10)

    swapSpec(make("<div hx-swap='swap:10 settle:11'/>")).swapStyle.should.equal("innerHTML")
    swapSpec(make("<div hx-swap='swap:10 settle:11'/>")).swapDelay.should.equal(10)
    swapSpec(make("<div hx-swap='swap:10 settle:11'/>")).settleDelay.should.equal(11)

    swapSpec(make("<div hx-swap='settle:11 swap:10'/>")).swapStyle.should.equal("innerHTML")
    swapSpec(make("<div hx-swap='settle:11 swap:10'/>")).swapDelay.should.equal(10)
    swapSpec(make("<div hx-swap='settle:11 swap:10'/>")).settleDelay.should.equal(11)

    swapSpec(make("<div hx-swap='customstyle settle:11 swap:10'/>")).swapStyle.should.equal("customstyle")
  })

  it('works with a swap delay', async () => {
    this.server.respondWith("GET", "/test", "Clicked!");
    var div = make("<div hx-get='/test' hx-swap='innerHTML swap:10ms'></div>");
    div.click();
    await fetchMock.flush(true)
    div.innerText.should.equal("");
    setTimeout(function () {
      div.innerText.should.equal("Clicked!");
      done();
    }, 30);
  });

  it('works with a settle delay', async () => {
    this.server.respondWith("GET", "/test", "<div id='d1' class='foo' hx-get='/test' hx-swap='outerHTML settle:10ms'></div>");
    var div = make("<div id='d1' hx-get='/test' hx-swap='outerHTML settle:10ms'></div>");
    div.click();
    await fetchMock.flush(true)
    div.classList.contains('foo').should.equal(false);
    setTimeout(function () {
      byId('d1').classList.contains('foo').should.equal(true);
      done();
    }, 30);
  });

  it('swap outerHTML properly  w/ data-* prefix', async () =>
    {
      fetchMock.get("/test", '<a id="a1" data-hx-get="/test2">Click Me</a>');
      fetchMock.get("/test2", "Clicked!");

      var div = make('<div id="d1" data-hx-get="/test" data-hx-swap="outerHTML"></div>')
      div.click();
      should.equal(byId("d1"), div);
      await fetchMock.flush(true)
      should.equal(byId("d1"), null);
      byId("a1").click();
      await fetchMock.flush(true)
      byId("a1").innerHTML.should.equal('Clicked!');
    });

  it('swap none works properly', async () =>
    {
      this.server.respondWith("GET", "/test", 'Ooops, swapped');

      var div = make('<div hx-swap="none" hx-get="/test">Foo</div>')
      div.click();
      await fetchMock.flush(true)
      div.innerHTML.should.equal('Foo');
    });


  it('swap outerHTML does not trigger htmx:afterSwap on original element', async () =>
    {
      this.server.respondWith("GET", "/test", 'Clicked!');
      var div = make('<div id="d1" hx-get="/test" hx-swap="outerHTML"></div>')
      div.addEventListener("htmx:afterSwap", async () =>{
        count++;
      })
      div.click();
      var count = 0;
      should.equal(byId("d1"), div);
      await fetchMock.flush(true)
      should.equal(byId("d1"), null);
      count.should.equal(0);
    });
  it('swap delete works properly', async () =>
    {
      this.server.respondWith("GET", "/test", 'Oops, deleted!');

      var div = make('<div id="d1" hx-swap="delete" hx-get="/test">Foo</div>')
      div.click();
      await fetchMock.flush(true)
      should.equal(byId("d1"), null);
    });

  it('in presence of bad swap spec, it uses the default swap strategy', async () =>
    {
      var initialSwapStyle = htmx.config.defaultSwapStyle;
      htmx.config.defaultSwapStyle = "outerHTML";
      try {
        this.server.respondWith("GET", "/test", "Clicked!");

        var div = make('<div><button id="b1" hx-swap="foo" hx-get="/test">Initial</button></div>')
        var b1 = byId("b1");
        b1.click();
        await fetchMock.flush(true)
        div.innerHTML.should.equal('Clicked!');
      } finally {
        htmx.config.defaultSwapStyle = initialSwapStyle;
      }
    });

  it('hx-swap ignoreTitle works', async () =>
    {
      window.document.title = "Test Title";
      this.server.respondWith("GET", "/test", function (xhr) {
        xhr.respond(200, {}, "<title class=''>htmx rocks!</title>Clicked!");
      });
      var btn = make('<button hx-get="/test" hx-swap="innerHTML ignoreTitle:true">Click Me!</button>')
      btn.click();
      await fetchMock.flush(true)
      btn.innerText.should.equal("Clicked!");
      window.document.title.should.equal("Test Title");
    });

})
