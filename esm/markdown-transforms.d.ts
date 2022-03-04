import { Element } from 'hast';
import { JsmlNode } from "./jsml.js";
import { LessonSectionEntry } from './content/lesson-section.js';
export declare const buildAssetTransform: (buildAssetPath: (path: string) => string) => (element: Element, node: JsmlNode) => Promise<JsmlNode>;
export declare const buildFigTransform: (buildAssetPath: (path: string) => string) => (element: Element, node: JsmlNode) => Promise<JsmlNode>;
export declare const codeTransform: (_: Element, node: JsmlNode) => Promise<JsmlNode>;
export declare const buildExcTransform: (lessonSectionEntry: LessonSectionEntry) => (element: Element, node: JsmlNode) => Promise<JsmlNode>;
