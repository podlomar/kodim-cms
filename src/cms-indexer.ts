import { ContentType } from "filefish/content-type";
import { FilefishIndexer } from "filefish/indexer";

export type RepoRecord = {
  repoPath: string;
  contentPath: string[];
  contentType: ContentType<any, any, any>;
};

export type RepoRegistry = { 
  [repoUrl: string]: RepoRecord[];
};

export class KodimCmsIndexer extends FilefishIndexer {
  private readonly repoRegistry: RepoRegistry;
  
  public constructor(contentId: string, parentContentPath: string[], repoRegistry: RepoRegistry) {
    super(contentId, parentContentPath);
    this.repoRegistry = repoRegistry;
  }

  public createChild(contentId: string, name: string): KodimCmsIndexer {
    return new KodimCmsIndexer(contentId, [...this.contentPath, name], this.repoRegistry);
  }

  public registerRepo(
    repoUrl: string,
    repoPath: string,
    contentPath: string[],
    contentType: ContentType<any, any, any>,
  ): void {
    const normlizedUrl = repoUrl.endsWith('.git') ? repoUrl : repoUrl + '.git';
    if (!this.repoRegistry[normlizedUrl]) {
      this.repoRegistry[normlizedUrl] = [];
    }

    this.repoRegistry[normlizedUrl].push({ repoPath, contentPath, contentType });
  }
}
