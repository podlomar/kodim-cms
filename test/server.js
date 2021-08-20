import express from 'express';
import { ContentIndex } from '../esm/index.js';
import createApiRouter from '../esm/api-router.js';

(async () => {
  const contenIndex = await ContentIndex.load(
    process.env.CONTENT_FOLDER,
    process.env.BASE_URL,
  );

  const app = express();
  app.use('/api/v1', createApiRouter(contenIndex));
  
  app.listen(process.env.PORT, () => {
    console.log(`listening on ${process.env.PORT}`);
  });
})();

