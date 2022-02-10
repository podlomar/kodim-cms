import { Router } from 'express';
import { KodimCms } from '.';
import { AccessCheck } from "./content/access-check.js";
export declare class CmsApp {
    readonly router: Router;
    private cms;
    private getAccessCheck;
    constructor(cms: KodimCms, getAccessCheck: () => AccessCheck);
    private getProviderByPath;
    private handleGetEntry;
    private handleGetAsset;
    private handleHooks;
}
