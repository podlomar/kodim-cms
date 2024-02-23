import { ContentType } from "filefish/content-type";
import { FilefishIndexer } from "filefish/indexer";

export type RepoRecord = {
  repoPath: string;
  contentPath: string[];
  contentType: ContentType<any, any, any>;
};

export type RepoRegistry = { 
  [repoUrl in string]?: RepoRecord[];
};

export class KodimCmsIndexer extends FilefishIndexer {
  private readonly repoRegistry: RepoRegistry;
  
  public constructor(contentId: string, parentContentPath: string[], repoRegistry: RepoRegistry) {
    super(contentId, parentContentPath);
    this.repoRegistry = repoRegistry;
  }

  public createChild(contentId: string, name: string): KodimCmsIndexer {
    return new KodimCmsIndexer(contentId, [...this.parentContentPath, name], this.repoRegistry);
  }

  public registerRepo(
    repoUrl: string,
    repoPath: string,
    contentPath: string[],
    contentType: ContentType<any, any, any>,
  ): void {
    const normlizedUrl = repoUrl.endsWith('.git') ? repoUrl : repoUrl + '.git';
    const records = this.repoRegistry[normlizedUrl] ?? [];
    records.push({ repoPath, contentPath, contentType });
    this.repoRegistry[normlizedUrl] = records;
  }
}
