export type AttrValue = boolean | number | string | null | undefined | Array<string | number>;

export interface JsmlAttrs {
  [key: string]: AttrValue;
}

export type JsmlElement = 
  | [string]
  | [string, JsmlAttrs]
  | [string, ...JsmlNode[]]
  | [string, JsmlAttrs, ...JsmlNode[]];

export type JsmlNode = JsmlElement | string;

export type Jsml = JsmlNode[];

export const el = (tag: string, attrs?: JsmlAttrs | null, ...children: JsmlNode[]): JsmlElement => {
  if (
    attrs === undefined 
    || attrs === null 
    || Object.keys(attrs).length === 0) {
    return [tag, ...children];
  }
  
  return [tag, attrs, ...children];
}

export const isAttrs = (value: JsmlNode | JsmlAttrs | undefined): value is JsmlAttrs => {
  return typeof value === "object" && !Array.isArray(value);
}

export const isElement = (node: JsmlNode): node is JsmlElement => {
  return typeof node !== "string";
}

export const getTag = (element: JsmlElement): string => element[0];

export const getAttrs = (element: JsmlElement): JsmlAttrs => isAttrs(element[1]) 
  ? element[1]
  : {};

export const getChildren = ([_, maybeAttrs, ...rest]: JsmlElement): JsmlNode[] => {
  if (maybeAttrs === undefined) {
    return [];
  }

  if (isAttrs(maybeAttrs)) {
    return rest;
  }

  return [maybeAttrs, ...rest];
}

export const setAttr = (
  element: JsmlElement, key: string, value: AttrValue
): JsmlElement => el(
  getTag(element), 
  { ...getAttrs(element), [key]: value }, 
  ...getChildren(element),
);