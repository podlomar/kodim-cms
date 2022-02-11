;
export const createBaseEntry = (parentBase, index, link, fsPath) => {
    var _a, _b, _c;
    let authors = parentBase.authors;
    if (index.author !== undefined) {
        if (typeof index.author === 'string') {
            authors = [...authors, index.author];
        }
        else {
            authors = [...authors, ...index.author];
        }
    }
    return {
        link,
        title: (_a = index.title) !== null && _a !== void 0 ? _a : link,
        path: `${parentBase.path}/${link}`,
        fsPath: fsPath !== null && fsPath !== void 0 ? fsPath : `${parentBase.fsPath}/${link}`,
        authors,
        draft: (_b = index.draft) !== null && _b !== void 0 ? _b : false,
        access: (_c = index.access) !== null && _c !== void 0 ? _c : parentBase.access,
    };
};
export const createBrokenEntry = (parentBase, link, fsPath) => {
    return {
        nodeType: 'broken',
        link,
        title: link,
        path: `${parentBase.path}/${link}`,
        fsPath: fsPath !== null && fsPath !== void 0 ? fsPath : `${parentBase.fsPath}/${link}`,
        authors: parentBase.authors,
        draft: false,
        access: parentBase.access,
    };
};
