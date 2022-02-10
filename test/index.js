import express from 'express';
import { KodimCms } from '../esm/index.js';
import { CmsApp } from '../esm/server.js';
import { AccessClaimCheck } from '../esm/content/access-check.js';

const PORT = 2001;

const cms = await KodimCms.load(
  '/home/podlomar/work/projects/kodim/new-content',
  `http://localhost:${PORT}/cms`
);

const accessCheck = AccessClaimCheck.create(
  {
    login: 'pokus',
    access: 'public',
  },
  // '/kurzy/daweb/**'
  // '/kurzy/daweb/*/*/*/cvlekce>*'
  // 'kurzy/daweb/zaklady-js/*/cvdoma/*',
  // 'kurzy/daweb/*/*/cvlekce/*'
);

const getAccessCheck = () => accessCheck;

const app = new CmsApp(cms, getAccessCheck);

const server = express();
server.use('/cms', app.router);

server.listen(PORT, () => console.log('listenig...'));
