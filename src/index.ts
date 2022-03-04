import { RootEntry, RootLoader } from "./content/root.js";
import { OkQuery } from "./core/query.js";

export class KodimCms {
  public readonly baseUrl: string;
  private readonly root: RootEntry;

  private constructor(baseUrl: string, root: RootEntry) {
    this.baseUrl = baseUrl;
    this.root = root;
  }

  public static async load(contentFolder: string, baseUrl: string): Promise<KodimCms> {
    const rootEntry = await new RootLoader(contentFolder).loadOne('kurzy', 0);
    const cms = new KodimCms(baseUrl, rootEntry);
    return cms;
  }

  public query(): OkQuery<RootEntry> {
    return OkQuery.of(this.root);
  }

  // public getRoot(accessCheck: AccessCheck): CoursesRootProvider {
  //   return new CoursesRootProvider(
  //     null,
  //     this.coursesRoot,
  //     0,
  //     [],
  //     accessCheck.step(this.coursesRoot),
  //     { baseUrl: this.baseUrl }
  //   );
  // }
}
