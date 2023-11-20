describe("Core htmx AJAX Verbs", async () => {
    beforeEach(async () => {
        clearWorkArea();
    });
    afterEach(async () => {
        fetchMock.restore()
        clearWorkArea();
    });

    it('handles basic posts properly', async () => {
        fetchMock.post("/test", 'post')
        var div = make('<div hx-post="/test">click me</div>');
        div.click();
        await fetchMock.flush(true)
        div.innerHTML.should.equal("post");
    })

    it('handles basic put properly', async () => {
        fetchMock.put("/test", 'put')
        var div = make('<div hx-put="/test">click me</div>');
        div.click();
        await fetchMock.flush(true)
        div.innerHTML.should.equal("put");
    })

    it('handles basic patch properly', async () => {
        fetchMock.patch("/test", 'patch')
        var div = make('<div hx-patch="/test">click me</div>');
        div.click();
        await fetchMock.flush(true)
        div.innerHTML.should.equal("patch");
    })

    it('handles basic delete properly', async () => {
        fetchMock.delete("/test", 'delete')
        var div = make('<div hx-delete="/test">click me</div>');
        div.click();
        await fetchMock.flush(true)
        div.innerHTML.should.equal("delete");
    })

});

