import { Root, Content, Element } from 'hast';
import { Jsml, JsmlNode, el } from './jsml.js';

export type TransformFunc = (element: Element, node: JsmlNode) => JsmlNode | Promise<JsmlNode>;

export interface ElementTransform {
  [tagName: string]: TransformFunc;
}

export const elementToJsml = async (
  element: Element, transform: ElementTransform
): Promise<JsmlNode> => {
  const node = el(
    element.tagName, 
    element.properties,
    ...await childrenToJsml(element.children, transform),
  );

  const transformFunc = transform[element.tagName];
  return transformFunc === undefined ? node : transformFunc(element, node)
};

export const contentToJsml = async (
  content: Content, transform: ElementTransform
): Promise<JsmlNode> => {
  if (content.type === 'text') {
    return content.value;
  }

  if (content.type === 'element') {
    return elementToJsml(content, transform);
  }

  return 'unexpected node type';
}

const childrenToJsml = async (
  children: Content[], transform: ElementTransform
): Promise<JsmlNode[]> => Promise.all(
  children
    .filter((child) => !(child.type === 'text' && child.value === '\n'))
    .map((content) => contentToJsml(content, transform))
);

export const rootToJsml = async (
  root: Root,
  transform: ElementTransform = {},
): Promise<Jsml> => childrenToJsml(root.children, transform);