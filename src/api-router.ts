import express from 'express';
import { ContentIndex } from './index.js';

const createApiRouter = (contentIndex: ContentIndex) => {
  const router = express.Router();
  router.use(express.json());

  router.get('/content', async (req, res) => {
    const resource = await contentIndex.query('/');
    res.send(resource);
  });

  router.get('/content/*', async (req, res) => {
    const params = req.params as {[key: string]: string};
    const resource = await contentIndex.query(`/${params['0']}`);
    res.send(resource);
  });

  return router;
};

export default createApiRouter;