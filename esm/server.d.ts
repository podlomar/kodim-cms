import { Router } from 'express';
import { KodimCms } from '.';
import { Access } from "./content/access.js";
export declare class CmsApp {
    readonly router: Router;
    private cms;
    private getAccess;
    constructor(cms: KodimCms, getAccess: () => Access);
    private getProviderByPath;
    private handleGetEntry;
    private handleGetAsset;
    private handleHooks;
}
