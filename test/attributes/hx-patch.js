describe("hx-patch attribute", function(){
    beforeEach(async () => {
        clearWorkArea();
    });
    afterEach(async () => {
        fetchMock.restore()
        clearWorkArea();
    });

    it('issues a PATCH request', async () => {
        fetchMock.patch("/test", 'Patched!')
        var btn = make('<button hx-patch="/test">Click Me!</button>')
        btn.click();
        await fetchMock.flush(true)
        btn.innerHTML.should.equal("Patched!");
    });

    it('issues a PATCH request w/ data-* prefix', async () => {
        fetchMock.patch("/test", 'Patched!')
        var btn = make('<button data-hx-patch="/test">Click Me!</button>')
        btn.click();
        await fetchMock.flush(true)
        btn.innerHTML.should.equal("Patched!");
    });
})
