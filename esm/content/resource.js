;
;
;
;
const createBaseResource = (entry, baseUrl) => ({
    link: entry.link,
    path: entry.path,
    url: `${baseUrl}/content${entry.path}`,
});
export const createSuccessResource = (entry, crumbs, baseUrl) => (Object.assign(Object.assign({ type: 'content' }, createBaseResource(entry, baseUrl)), { crumbs, title: entry.title }));
export const createFailedResource = (entry, baseUrl) => (Object.assign(Object.assign({}, createBaseResource(entry, baseUrl)), { type: 'failed' }));
export const createForbiddenResource = (entry, baseUrl) => (Object.assign(Object.assign({}, createBaseResource(entry, baseUrl)), { type: 'forbidden' }));
export const createNotFound = () => ({
    type: 'not-found',
});
export const createSuccessRef = (entry, baseUrl) => (Object.assign(Object.assign({ type: 'ref' }, createBaseResource(entry, baseUrl)), { title: entry.title }));
export const createFailedRef = (entry, baseUrl) => (Object.assign({ type: 'failed' }, createBaseResource(entry, baseUrl)));
export const createForbiddenRef = (entry, baseUrl) => (Object.assign({ type: 'forbidden' }, createBaseResource(entry, baseUrl)));
export const createResourceRef = (entry, baseUrl) => entry.type === 'failed'
    ? createFailedRef(entry, baseUrl)
    : createSuccessRef(entry, baseUrl);
export const buildAssetPath = (fileName, entryPath, baseUrl) => {
    return `${baseUrl}/assets${entryPath}/${fileName}`;
};
