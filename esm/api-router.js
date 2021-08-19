import express from 'express';
const createApiRouter = (contentIndex) => {
    const router = express.Router();
    router.use(express.json());
    router.get('/content', async (req, res) => {
        const resource = await contentIndex.query('/');
        res.send(resource);
    });
    router.get('/content/*', async (req, res) => {
        const params = req.params;
        const resource = await contentIndex.query(`/${params['0']}`);
        res.send(resource);
    });
    return router;
};
export default createApiRouter;
