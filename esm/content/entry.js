export const createSuccessEntry = (parentEntry, link, title, fsPath) => ({
    type: 'success',
    link,
    title,
    path: `${parentEntry.path}/${link}`,
    fsPath: fsPath !== null && fsPath !== void 0 ? fsPath : `${parentEntry.fsPath}/${link}`,
});
export const createFailedEntry = (parentEntry, link, fsPath) => ({
    type: 'failed',
    link,
    path: `${parentEntry.path}/${link}`,
    fsPath: fsPath !== null && fsPath !== void 0 ? fsPath : `${parentEntry.fsPath}/${link}`,
});
