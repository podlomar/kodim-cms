export const createChildLocation = (parentLocation, link, fsPath) => ({
    path: `${parentLocation.path}/${link}`,
    fsPath: fsPath !== null && fsPath !== void 0 ? fsPath : `${parentLocation.fsPath}/${link}`,
});
;
export const createBaseEntry = (location, link, props, title) => ({
    link,
    title: title !== null && title !== void 0 ? title : link,
    location,
    props,
});
