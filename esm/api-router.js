import express from 'express';
const queryFromRequest = (req) => {
    const links = req.params['0'] === undefined ? [] : req.params['0'].split('/');
    const steps = [];
    for (let i = 0; i < links.length; i += 2) {
        const list = links[i];
        const link = i < (links.length - 1) ? links[i + 1] : null;
        steps.push({ list, link });
    }
    let expand = [];
    if (Array.isArray(req.query.expand)) {
        expand = req.query.expand;
    }
    else if (typeof req.query.expand === 'string') {
        expand = [req.query.expand];
    }
    return { steps, expand };
};
const createApiRouter = (contentIndex) => {
    const router = express.Router();
    router.use(express.json());
    router.get('/content', async (req, res) => {
        const query = queryFromRequest(req);
        console.log('query', query);
        const resource = await contentIndex.fetch(query);
        res.send(resource);
    });
    router.get('/content/*', async (req, res) => {
        const query = queryFromRequest(req);
        console.log('query', query);
        const resource = await contentIndex.fetch(query);
        res.send(resource);
    });
    return router;
};
export default createApiRouter;
