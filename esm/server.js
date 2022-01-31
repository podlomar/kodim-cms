import express from 'express';
import { AccessGranted } from "./content/access.js";
export class CmsApp {
    constructor(cms, getAccess) {
        this.handleGetEntry = async (req, res) => {
            var _a;
            const provider = this.getProviderByPath((_a = req.params[0]) !== null && _a !== void 0 ? _a : '');
            res.json(await provider.fetch());
        };
        this.handleGetAsset = async (req, res) => {
            const lastSlashIndex = req.params[0].lastIndexOf('/');
            const fileName = req.params[0].slice(lastSlashIndex + 1);
            const providerPath = req.params[0].slice(0, lastSlashIndex);
            const assetPath = this.getProviderByPath(providerPath).asset(fileName);
            res.sendFile(assetPath);
        };
        this.handleHooks = async (req, res) => {
            const url = req.body.repository.clone_url;
            const access = new AccessGranted();
            const provider = this.cms.getRoot(access).findRepo(url);
            console.log(url);
            if (provider === null) {
                res.sendStatus(400);
                return;
            }
            await (provider === null || provider === void 0 ? void 0 : provider.reload());
            res.send(`reloaded ${url}`);
        };
        this.cms = cms;
        this.getAccess = getAccess;
        this.router = express.Router();
        this.router.use(express.json());
        this.router.get(['/content/kurzy', '/content/kurzy/*'], this.handleGetEntry);
        this.router.get(['/assets/kurzy', '/assets/kurzy/*'], this.handleGetAsset);
        this.router.post('/hooks', this.handleHooks);
    }
    getProviderByPath(path) {
        const links = path.split('/');
        const access = this.getAccess();
        return this.cms.getRoot(access).search(...links);
    }
}
