export interface ResourceRef {
    readonly targetUrl: string;
    readonly title: string;
    readonly path: string;
}
export interface Crumb {
    readonly path: string;
    readonly title: string;
}
export interface Resource {
    readonly type: string;
    readonly link: string;
    readonly path: string;
    readonly url: string;
    readonly title: string;
    readonly crumbs: readonly Crumb[];
}
