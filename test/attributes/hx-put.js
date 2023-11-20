describe("hx-put attribute", function(){
    beforeEach(async () => {
        clearWorkArea();
    });
    afterEach(async () =>  {
        fetchMock.restore()
        clearWorkArea();
    });

    it('issues a PUT request', async () => {
        fetchMock.put("/test", 'Putted!')
        var btn = make('<button hx-put="/test">Click Me!</button>')
        btn.click();
        await fetchMock.flush(true)
        btn.innerHTML.should.equal("Putted!");
    });

    it('issues a PUT request w/ data-* prefix', async () => {
        fetchMock.put("/test", 'Putted!')
        var btn = make('<button data-hx-put="/test">Click Me!</button>')
        btn.click();
        await fetchMock.flush(true)
        btn.innerHTML.should.equal("Putted!");
    });
})
