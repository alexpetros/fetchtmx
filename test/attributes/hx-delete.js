describe("hx-delete attribute", function(){
    beforeEach(function() {
        clearWorkArea();
    });
    afterEach(function()  {
        fetchMock.restore()
        clearWorkArea();
    });

    it('issues a DELETE request', async () => {
        fetchMock.delete("/test", 'Deleted!')

        var btn = make('<button hx-delete="/test">Click Me!</button>')
        btn.click();
        await fetchMock.flush(true)
        btn.innerHTML.should.equal("Deleted!");
    });

    it('issues a DELETE request w/ data-* prefix', async () => {
        fetchMock.delete("/test", 'Deleted!')
        var btn = make('<button data-hx-delete="/test">Click Me!</button>')
        btn.click();
        await fetchMock.flush(true)
        btn.innerHTML.should.equal("Deleted!");
    });
})
