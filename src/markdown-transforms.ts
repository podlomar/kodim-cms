import { escape } from 'html-escaper';
import { Element } from 'hast';
import { JsmlNode, JsmlElement, setAttr, getChildren, el, getAttrs } from "./jsml.js";
import { LessonSectionEntry } from './content/lesson-section.js';

interface RefAttr {
  path: string,
  name: 'src' | 'href',
};

const urlFromElement = (element: Element): RefAttr | null => {
  if (element.properties === undefined) {
    return null;
  }

  if (element.properties.href !== undefined) {
    return {
      path: String(element.properties.href),
      name: 'href',
    };
  }

  if (element.properties.src !== undefined) {
    return {
      path: String(element.properties.src),
      name: 'src',
    }
  }

  return null;
}

export const buildAssetTransform = (
  buildAssetPath: (path: string) => string,
) => async (
  element: Element, node: JsmlNode
): Promise<JsmlNode> => {
    const refAttr = urlFromElement(element);
    if (refAttr === null) {
      return node;
    }

    if (refAttr.path.startsWith('assets/')) {
      return setAttr(
        node as JsmlElement,
        refAttr.name,
        buildAssetPath(refAttr.path.slice(7)),
      );
    }

    return node;
  }

export const buildFigTransform = (
  buildAssetPath: (path: string) => string,
) => async (
  element: Element, node: JsmlNode
): Promise<JsmlNode> => {
    const assetTransform = buildAssetTransform(buildAssetPath);
    const children = getChildren(node as JsmlElement);
    const attrs = getAttrs(node as JsmlElement);

    return assetTransform(
      element,
      el('fig', { ...attrs, alt: String(children[0]) }),
    );
  }

export const codeTransform = async (
  _: Element, node: JsmlNode
): Promise<JsmlNode> => {
  const children = getChildren(node as JsmlElement);
  const attrs = getAttrs(node as JsmlElement);

  return el(
    'code', attrs, ...children.map((child) => escape(String(child)))
  );
}

export const buildExcTransform = (lessonSectionEntry: LessonSectionEntry) => async (
  element: Element, node: JsmlNode
): Promise<JsmlNode> => {
  const linkChild = element.children[0];
  if (linkChild.type !== 'text') {
    return node;
  }

  const link = linkChild.value;
  const exerciseEntry = lessonSectionEntry.findSubEntry(link);

  if (exerciseEntry === null) {
    return node;
  }

  return exerciseEntry.fetchAssign();
};