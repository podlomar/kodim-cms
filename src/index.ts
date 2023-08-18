import { ContentType } from "filefish/dist/content-types.js";
import { Cursor, OkCursor } from "filefish/dist/cursor.js";
import { Filefish, filefish, Asset, FilefishOptions } from "filefish/dist/index.js";
import { IndexEntry } from "filefish/dist/treeindex.js";
import { FsNode } from "fs-inquire";
import { RootEntry, RootContentType } from "./content/root.js";

export class KodimCms {
  private readonly ff: Filefish<RootEntry>;

  private constructor(ff: Filefish<RootEntry>) {
    this.ff = ff;
  }

  public static async load(
    contentPath: string,
    options: Partial<FilefishOptions> = {}
  ): Promise<KodimCms> {
    const ff = await filefish<RootEntry>(contentPath, RootContentType, options);
    return new KodimCms(ff!);
  }

  public async loadContent<C>(
    cursor: Cursor, contentType: ContentType<FsNode, IndexEntry, C>
  ): Promise<C | null> {
    const content = await this.ff.loadContent(cursor, contentType);
    if (content === 'forbidden' || content === 'not-found' || content === 'mismatch') {
      return null;
    }

    return content;
  }

  public async loadAsset(cursor: Cursor, assetName: string): Promise<Asset | null> {
    const asset = await this.ff.loadAsset(cursor, assetName);
    if (asset === 'not-found') {
      return null;
    }

    return asset;
  }

  public rootCursor(): OkCursor {
    return this.ff.rootCursor();
  }
}
