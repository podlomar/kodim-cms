import express from 'express';
export class CmsApp {
    constructor(cms) {
        this.handleGetEntry = async (req, res) => {
            var _a;
            console.log('params', req.params[0]);
            const provider = this.getProviderByPath((_a = req.params[0]) !== null && _a !== void 0 ? _a : '');
            res.json(await (provider === null || provider === void 0 ? void 0 : provider.fetch()));
        };
        this.handleGetAsset = async (req, res) => {
            var _a;
            const lastSlashIndex = req.params[0].lastIndexOf('/');
            const fileName = req.params[0].slice(lastSlashIndex + 1);
            const providerPath = req.params[0].slice(0, lastSlashIndex);
            const assetPath = (_a = this.getProviderByPath(providerPath)) === null || _a === void 0 ? void 0 : _a.asset(fileName);
            res.sendFile(assetPath);
        };
        this.cms = cms;
        this.router = express.Router();
        this.router.get(['/content/kurzy', '/content/kurzy/*'], this.handleGetEntry);
        this.router.get(['/assets/kurzy', '/assets/kurzy/*'], this.handleGetAsset);
    }
    getProviderByPath(path) {
        const links = path.split('/');
        return this.cms.query().search(...links).getProvider();
    }
}
