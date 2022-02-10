;
export const createBaseResource = (entry, crumbs, baseUrl) => ({
    link: entry.link,
    path: entry.path,
    url: `${baseUrl}/content${entry.path}`,
    title: entry.title,
    crumbs,
});
export const createNotFound = () => ({
    status: 'not-found',
});
;
;
export const createBaseRef = (status, entry, baseUrl) => ({
    status,
    link: entry.link,
    path: entry.path,
    url: `${baseUrl}/content${entry.path}`,
    title: entry.title,
});
export const buildAssetPath = (fileName, entryPath, baseUrl) => {
    return `${baseUrl}/assets${entryPath}/${fileName}`;
};
