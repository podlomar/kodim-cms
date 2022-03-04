import { Router } from 'express';
import { KodimCms } from '.';
export declare class CmsApp {
    readonly router: Router;
    private cms;
    constructor(cms: KodimCms);
    private getQueryByPath;
    private handleGetEntry;
}
