import { ResourceRef } from './resource';

export const sampleResourceRef = (
  targetUrl: string,
  title: string,
): ResourceRef => ({
  targetUrl,
  title,
  path: '/',
});
