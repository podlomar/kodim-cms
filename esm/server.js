import express from 'express';
// import { AccessCheck, AccessGrantAll } from "./content/access-check.js";
export class CmsApp {
    // private getAccessCheck: () => AccessCheck;
    constructor(cms /*, getAccessCheck: () => AccessCheck*/) {
        this.handleGetEntry = async (req, res) => {
            var _a;
            const provider = this.getQueryByPath((_a = req.params[0]) !== null && _a !== void 0 ? _a : '');
            res.json(await provider.fetch());
        };
        this.cms = cms;
        // this.getAccessCheck = getAccessCheck;
        this.router = express.Router();
        this.router.use(express.json());
        this.router.get(['/content/kurzy', '/content/kurzy/*'], this.handleGetEntry);
        // this.router.get(['/assets/kurzy', '/assets/kurzy/*'], this.handleGetAsset); 
        // this.router.post('/hooks', this.handleHooks); 
    }
    getQueryByPath(path) {
        const links = path.split('/');
        // const accessCheck = this.getAccessCheck();
        return this.cms.query().search(...links);
    }
}
