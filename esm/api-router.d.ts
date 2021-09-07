import { Router } from 'express';
import { ContentIndex } from './index.js';
declare const createApiRouter: (contentIndex: ContentIndex) => Router;
export default createApiRouter;
