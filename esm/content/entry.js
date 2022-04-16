;
const removeGitExtension = (url) => {
    if (url.endsWith('.git')) {
        return url.slice(0, -4);
    }
    return url;
};
export const createBaseEntry = (parentBase, index, link, repo, fsPath) => {
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
    const entryFsPath = fsPath !== null && fsPath !== void 0 ? fsPath : `${parentBase.fsPath}/${link}`;
    let repository = parentBase.repository;
    if (repo !== undefined && repo !== null) {
        repository = Object.assign(Object.assign({}, repo), { baseUrl: removeGitExtension(repo.originUrl), entryFsPath });
    }
    return {
        link,
        title: (_a = index.title) !== null && _a !== void 0 ? _a : link,
        path: `${parentBase.path}/${link}`,
        fsPath: entryFsPath,
        repository,
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
        repository: null,
        authors: parentBase.authors,
        draft: false,
        access: parentBase.access,
    };
};
