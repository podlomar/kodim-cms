import { ContentType, IndexingContext } from "filefish/dist/content-types.js";

export type RepoRecord = {
  repoPath: string;
  contentPath: string[];
  contentType: ContentType;
};

export type RepoRegistry = { 
  [repoUrl: string]: RepoRecord[];
};

export class KodimCmsIndexingContext extends IndexingContext {
  private readonly repoRegistry: RepoRegistry;
  
  public constructor(contentId: string, parentContentPath: string[], repoRegistry: RepoRegistry) {
    super(contentId, parentContentPath);

    this.repoRegistry = repoRegistry;
  }

  public child(contentId: string, name: string): KodimCmsIndexingContext {
    return new KodimCmsIndexingContext(contentId, [...this.parentContentPath, name], this.repoRegistry);
  }

  public registerRepo(
    repoUrl: string, repoPath: string, contentPath: string[], contentType: ContentType
  ): void {
    const normlizedUrl = repoUrl.endsWith('.git') ? repoUrl : repoUrl + '.git';
    if (!this.repoRegistry[normlizedUrl]) {
      this.repoRegistry[normlizedUrl] = [];
    }

    this.repoRegistry[normlizedUrl].push({ repoPath, contentPath, contentType });
  }
}
