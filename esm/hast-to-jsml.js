import { el } from './jsml.js';
export const elementToJsml = async (element, transform) => {
    const node = el(element.tagName, element.properties, ...await childrenToJsml(element.children, transform));
    const transformFunc = transform[element.tagName];
    return transformFunc === undefined ? node : transformFunc(element, node);
};
export const contentToJsml = async (content, transform) => {
    if (content.type === 'text') {
        return content.value;
    }
    if (content.type === 'element') {
        return elementToJsml(content, transform);
    }
    return 'unexpected node type';
};
const childrenToJsml = async (children, transform) => Promise.all(children
    .filter((child) => !(child.type === 'text' && child.value === '\n'))
    .map((content) => contentToJsml(content, transform)));
export const rootToJsml = async (root, transform = {}) => childrenToJsml(root.children, transform);
