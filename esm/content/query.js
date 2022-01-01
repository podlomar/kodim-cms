export class NotFoundQuery {
    getProvider() {
        return null;
    }
    find(link) {
        return this;
    }
    search(...links) {
        return this;
    }
}
export class SuccessQuery {
    constructor(provider) {
        this.provider = provider;
    }
    getProvider() {
        return this.provider;
    }
    find(link) {
        const childProvider = this.provider.find(link);
        if (childProvider === null) {
            return new NotFoundQuery();
        }
        return new SuccessQuery(childProvider);
    }
    search(...links) {
        const childProvider = this.provider.search(...links);
        if (childProvider === null) {
            return new NotFoundQuery();
        }
        return new SuccessQuery(childProvider);
    }
}
