var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { promises as fs } from 'fs';
import { unified } from 'unified';
import markdown from 'remark-parse';
import directive from 'remark-directive';
import frontmatter from 'remark-frontmatter';
import rehype from 'remark-rehype';
import stringify from 'rehype-stringify';
import mdast from 'mdast-builder';
import lineReader from 'line-reader';
import path from 'path';
import yaml from 'yaml';
import { IndexNode } from '../tree-index.js';
var loadLesson = function (lessonPath) { return __awaiter(void 0, void 0, void 0, function () {
    var processor, text, tree, sections, currentTitle, currentRoot, _i, _a, child, hastRoot, html, hastRoot, html;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                processor = unified()
                    .use(markdown)
                    .use(frontmatter)
                    .use(directive)
                    .use(rehype)
                    .use(stringify);
                return [4 /*yield*/, fs.readFile(lessonPath, 'utf-8')];
            case 1:
                text = _b.sent();
                tree = processor.parse(text);
                sections = [];
                currentTitle = '';
                currentRoot = mdast.root();
                for (_i = 0, _a = tree.children; _i < _a.length; _i++) {
                    child = _a[_i];
                    if (child.type === 'heading') {
                        hastRoot = processor.runSync(currentRoot);
                        html = processor.stringify(hastRoot);
                        sections.push({
                            title: currentTitle,
                            html: html,
                        });
                        currentTitle = child.children[0].value;
                        currentRoot = mdast.root();
                    }
                    else {
                        currentRoot.children.push(child);
                    }
                }
                if (currentRoot.children.length > 0) {
                    hastRoot = processor.runSync(currentRoot);
                    html = processor.stringify(hastRoot);
                    sections.push({
                        title: currentTitle,
                        html: html,
                    });
                }
                console.log('result', sections);
                return [2 /*return*/, Promise.resolve(sections)];
        }
    });
}); };
var LessonNode = /** @class */ (function (_super) {
    __extends(LessonNode, _super);
    function LessonNode(location, frontMatter, num) {
        var _this = _super.call(this, location, frontMatter) || this;
        _this.num = num;
        return _this;
    }
    LessonNode.prototype.getResourceRef = function (baseUrl) {
        var baseRef = _super.prototype.getResourceRef.call(this, baseUrl);
        var frontMatter = this.index;
        return __assign(__assign({}, baseRef), { lead: frontMatter.lead, num: this.num });
    };
    LessonNode.prototype.loadResource = function (baseUrl) {
        return __awaiter(this, void 0, void 0, function () {
            var sections, base, frontMatter;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, loadLesson(path.join(this.location.fsPath, 'lesson.md'))];
                    case 1:
                        sections = _a.sent();
                        base = this.getResourceBase(baseUrl, 'lesson');
                        frontMatter = this.index;
                        return [2 /*return*/, __assign(__assign({}, base), { lead: frontMatter.lead, num: this.num, sections: sections })];
                }
            });
        });
    };
    return LessonNode;
}(IndexNode));
export { LessonNode };
var loadFrontMatter = function (filePath) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, new Promise(function (resolve) {
                var inside = false;
                var lines = '';
                lineReader.eachLine(filePath, function (line) {
                    if (inside) {
                        if (line.startsWith('---')) {
                            resolve(yaml.parse(lines));
                            return false;
                        }
                        lines += line + "\n";
                        return true;
                    }
                    if (line.startsWith('---')) {
                        inside = true;
                    }
                    return true;
                });
            })];
    });
}); };
export var loadLessonNode = function (parentLocation, fileName, num) { return __awaiter(void 0, void 0, void 0, function () {
    var frontMatter, location;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, loadFrontMatter(path.join(parentLocation.fsPath, fileName, 'lesson.md'))];
            case 1:
                frontMatter = _a.sent();
                location = parentLocation.createChildLocation(fileName, frontMatter);
                return [2 /*return*/, new LessonNode(location, frontMatter, num)];
        }
    });
}); };
