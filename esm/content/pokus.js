"use strict";
class StringProvider {
    fetch() {
        return 'ahoj';
    }
}
class Store {
    constructor() {
        this.entries = [];
    }
    static create(entries) {
        return new Store();
    }
    use(func) {
        return new Store();
    }
    wrap(entry) {
        return;
    }
}
const pokus = new Store()
    .use((pokusEntry) => {
    return {
        fetch() {
            return { title: 'ahoj' };
        }
    };
});
