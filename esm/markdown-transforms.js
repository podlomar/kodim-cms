import { escape } from 'html-escaper';
import { setAttr, getChildren, el, getAttrs } from "./jsml.js";
;
const urlFromElement = (element) => {
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
        };
    }
    return null;
};
export const buildAssetTransform = (buildAssetPath) => async (element, node) => {
    const refAttr = urlFromElement(element);
    if (refAttr === null) {
        return node;
    }
    if (refAttr.path.startsWith('assets/')) {
        return setAttr(node, refAttr.name, buildAssetPath(refAttr.path.slice(7)));
    }
    return node;
};
export const buildFigTransform = (buildAssetPath) => async (element, node) => {
    const assetTransform = buildAssetTransform(buildAssetPath);
    const children = getChildren(node);
    const attrs = getAttrs(node);
    return assetTransform(element, el('fig', Object.assign(Object.assign({}, attrs), { alt: String(children[0]) })));
};
export const codeTransform = async (_, node) => {
    const children = getChildren(node);
    const attrs = getAttrs(node);
    return el('code', attrs, ...children.map((child) => escape(String(child))));
};
export const buildExcTransform = (sectionProvider) => async (element, node) => {
    const linkChild = element.children[0];
    if (linkChild.type !== 'text') {
        return node;
    }
    const link = linkChild.value;
    const exerciseProvider = sectionProvider.find(link);
    if (exerciseProvider === null) {
        return node;
    }
    return exerciseProvider.fetchAssign();
};
