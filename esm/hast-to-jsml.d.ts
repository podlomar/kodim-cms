import { Root, Content, Element } from 'hast';
import { Jsml, JsmlNode } from './jsml.js';
export declare type TransformFunc = (element: Element, node: JsmlNode) => JsmlNode | Promise<JsmlNode>;
export interface ElementTransform {
    [tagName: string]: TransformFunc;
}
export declare const elementToJsml: (element: Element, transform: ElementTransform) => Promise<JsmlNode>;
export declare const contentToJsml: (content: Content, transform: ElementTransform) => Promise<JsmlNode>;
export declare const rootToJsml: (root: Root, transform?: ElementTransform) => Promise<Jsml>;
