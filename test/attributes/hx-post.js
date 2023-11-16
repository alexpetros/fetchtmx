describe("hx-post attribute", async () => {
    beforeEach(async () => {
        clearWorkArea();
    });

    afterEach(async () => {
        fetchMock.restore()
        clearWorkArea();
    });

    it('issues a POST request with proper headers', async () => {
        fetchMock.post("/test", 'Posted!')

        var btn = make('<button hx-post="/test">Click Me!</button>')
        btn.click();
        await fetchMock.flush(true)
        return btn.innerHTML.should.equal("Posted!");
    });

    it('issues a POST request with proper headers  w/ data-* prefix', async () => {
        fetchMock.post("/test", 'Posted!')
        var btn = make('<button data-hx-post="/test">Click Me!</button>')
        btn.click();
        await fetchMock.flush(true)
        return btn.innerHTML.should.equal("Posted!");
    });
})
