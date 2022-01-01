export const el = (tag, attrs, ...children) => {
    if (attrs === undefined
        || attrs === null
        || Object.keys(attrs).length === 0) {
        return [tag, ...children];
    }
    return [tag, attrs, ...children];
};
export const isAttrs = (value) => {
    return typeof value === "object" && !Array.isArray(value);
};
export const isElement = (node) => {
    return typeof node !== "string";
};
export const getTag = (element) => element[0];
export const getAttrs = (element) => isAttrs(element[1])
    ? element[1]
    : {};
export const getChildren = ([_, maybeAttrs, ...rest]) => {
    if (maybeAttrs === undefined) {
        return [];
    }
    if (isAttrs(maybeAttrs)) {
        return rest;
    }
    return [maybeAttrs, ...rest];
};
export const setAttr = (element, key, value) => el(getTag(element), Object.assign(Object.assign({}, getAttrs(element)), { [key]: value }), ...getChildren(element));
