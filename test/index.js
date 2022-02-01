import express from 'express';
import { KodimCms } from '../esm/index.js';
import { CmsApp } from '../esm/server.js';
import { AccessMachine } from '../esm/content/access.js';

const PORT = 2001;

const cms = await KodimCms.load(
  '/home/podlomar/work/projects/kodim/new-content',
  `http://localhost:${PORT}/cms`
);

const access = AccessMachine.create(
  '/kurzy/daweb/*'
  // '/kurzy/daweb/*/*/*/cvlekce>*'
  // 'kurzy/daweb/zaklady-js/*/cvdoma/*',
  // 'kurzy/daweb/*/*/cvlekce/*'
);

console.log(JSON.stringify(access, (key, value) => {
  if (key === 'regex') {
    return value.toString();
  }

  return value;
}, 2));

const getAccess = () => access;

const app = new CmsApp(cms, getAccess);

const server = express();
server.use('/cms', app.router);

server.listen(PORT, () => console.log('listenig...'));



// const m = machine
//   .step('kurzy')
//   .step('daweb')
//   .step('zaklady-j')
//   .step('pokus')
//   .step('cvdoma')
//   .step('ahoj');

// // console.log(JSON.stringify(machine.states, null, 2));
// console.log(m.accepts());


