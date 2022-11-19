export const createCrumbs = (entry) => {
    const basesPath = entry.getBasesPath();
    if (basesPath.length < 2) {
        return null;
    }
    if (basesPath.length === 2) {
        return [];
    }
    return basesPath.slice(1, -1).map((base) => {
        var _a;
        return ({
            path: base.contentPath,
            title: (_a = base.title) !== null && _a !== void 0 ? _a : base.link,
        });
    });
};
export const createBaseContent = (base) => ({
    link: base.link,
    path: base.contentPath,
    title: base.title,
});
;
;
