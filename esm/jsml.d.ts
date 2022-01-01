export declare type AttrValue = boolean | number | string | null | undefined | Array<string | number>;
export interface JsmlAttrs {
    [key: string]: AttrValue;
}
export declare type JsmlElement = [string] | [string, JsmlAttrs] | [string, ...JsmlNode[]] | [string, JsmlAttrs, ...JsmlNode[]];
export declare type JsmlNode = JsmlElement | string;
export declare type Jsml = JsmlNode[];
export declare const el: (tag: string, attrs?: JsmlAttrs | null | undefined, ...children: JsmlNode[]) => JsmlElement;
export declare const isAttrs: (value: JsmlNode | JsmlAttrs | undefined) => value is JsmlAttrs;
export declare const isElement: (node: JsmlNode) => node is JsmlElement;
export declare const getTag: (element: JsmlElement) => string;
export declare const getAttrs: (element: JsmlElement) => JsmlAttrs;
export declare const getChildren: ([_, maybeAttrs, ...rest]: JsmlElement) => JsmlNode[];
export declare const setAttr: (element: JsmlElement, key: string, value: AttrValue) => JsmlElement;
