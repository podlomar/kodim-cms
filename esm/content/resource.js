;
;
;
;
const createBaseResource = (entry, baseUrl) => ({
    link: entry.link,
    title: entry.title,
    path: entry.location.path,
    url: `${baseUrl}/content${entry.location.path}`,
});
export const createOkResource = (entry, crumbs, baseUrl) => (Object.assign(Object.assign({ status: 'ok' }, createBaseResource(entry, baseUrl)), { crumbs }));
export const createBrokenResource = (entry, crumbs, baseUrl) => (Object.assign(Object.assign({ status: 'broken' }, createBaseResource(entry, baseUrl)), { crumbs }));
export const createForbiddenResource = (entry, baseUrl) => (Object.assign({ status: 'forbidden' }, createBaseResource(entry, baseUrl)));
export const createNotFound = () => ({
    status: 'not-found',
});
export const createOkRef = (entry, baseUrl) => (Object.assign({ status: 'ok' }, createBaseResource(entry, baseUrl)));
export const createBrokenRef = (entry, baseUrl) => (Object.assign({ status: 'broken' }, createBaseResource(entry, baseUrl)));
export const createForbiddenRef = (title) => ({
    status: 'forbidden',
    title,
});
export const createResourceRef = (entry, baseUrl) => entry.type === 'broken'
    ? createBrokenRef(entry, baseUrl)
    : createOkRef(entry, baseUrl);
export const buildAssetPath = (fileName, entryPath, baseUrl) => {
    return `${baseUrl}/assets${entryPath}/${fileName}`;
};
