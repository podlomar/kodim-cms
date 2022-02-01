;
export const createBaseEntry = (parentLocation, link, title, fsPath) => ({
    link,
    location: {
        path: `${parentLocation.path}/${link}`,
        fsPath: fsPath !== null && fsPath !== void 0 ? fsPath : `${parentLocation.fsPath}/${link}`,
    },
    title: title !== null && title !== void 0 ? title : link,
});
export const createSuccessEntry = (parentLocation, link, title, fsPath) => (Object.assign({ type: 'success' }, createBaseEntry(parentLocation, link, title, fsPath)));
export const createBrokenEntry = (parentLocation, link, title, fsPath) => (Object.assign({ type: 'broken' }, createBaseEntry(parentLocation, link, title, fsPath)));
