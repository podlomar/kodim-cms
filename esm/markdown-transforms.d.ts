import { Element } from 'hast';
import { JsmlNode } from "./jsml.js";
import { LessonSectionProvider } from './content/lesson-section.js';
export declare const buildAssetTransform: (buildAssetPath: (path: string) => string) => (element: Element, node: JsmlNode) => Promise<JsmlNode>;
export declare const buildFigTransform: (buildAssetPath: (path: string) => string) => (element: Element, node: JsmlNode) => Promise<JsmlNode>;
export declare const buildExcTransform: (sectionProvider: LessonSectionProvider) => (element: Element, node: JsmlNode) => Promise<JsmlNode>;
