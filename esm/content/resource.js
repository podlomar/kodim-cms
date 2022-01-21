;
;
;
;
const createResourceLocation = (entry, baseUrl) => ({
    link: entry.link,
    path: entry.path,
    url: `${baseUrl}/content${entry.path}`,
});
export const createSuccessResource = (entry, crumbs, baseUrl) => (Object.assign(Object.assign({ type: 'content' }, createResourceLocation(entry, baseUrl)), { crumbs, title: entry.title }));
export const createFailedResource = (entry, baseUrl) => (Object.assign(Object.assign({}, createResourceLocation(entry, baseUrl)), { type: 'failed' }));
export const createNotFound = () => ({
    type: 'not-found',
});
export const createSuccessRef = (entry, baseUrl) => (Object.assign(Object.assign({ type: 'ref' }, createResourceLocation(entry, baseUrl)), { title: entry.title }));
export const createFailedRef = (entry, baseUrl) => (Object.assign({ type: 'failed' }, createResourceLocation(entry, baseUrl)));
export const createResourceRef = (entry, baseUrl) => entry.type === 'failed'
    ? createFailedRef(entry, baseUrl)
    : createSuccessRef(entry, baseUrl);
export const buildAssetPath = (fileName, entryPath, baseUrl) => {
    return `${baseUrl}/assets${entryPath}/${fileName}`;
};
