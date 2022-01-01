import express from 'express';
import { KodimCms } from '../esm/index.js';
import { CmsApp } from '../esm/server.js';

const PORT = 2001;

const cms = await KodimCms.load(
  '/home/podlomar/work/projects/kodim/new-content',
  `http://localhost:${PORT}/cms`
);
const app = new CmsApp(cms);
const access = {
  claims: [
    '/*/**',
  ]
};

const server = express();

server.use('/cms', app.router);

server.listen(PORT, () => console.log('listenig...'));
