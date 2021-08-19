import { ContentIndex } from './index.js';
declare const createApiRouter: (contentIndex: ContentIndex) => import("express-serve-static-core").Router;
export default createApiRouter;
