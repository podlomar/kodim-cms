import { CoursesRootEntry, CoursesRootProvider, loadCoursesRoot } from "./content/content.js";
import { AccessCheck } from "./content/access-check.js";

export class KodimCms{
  public readonly baseUrl: string;
  private readonly coursesRoot: CoursesRootEntry;
  
  private constructor(baseUrl: string, coursesRoot: CoursesRootEntry) {
    this.baseUrl = baseUrl;
    this.coursesRoot = coursesRoot;
  }

  public static async load(contentFolder: string, baseUrl: string): Promise<KodimCms> {
    const root = await loadCoursesRoot(contentFolder, "kurzy");
    const cms = new KodimCms(baseUrl, root);
    return cms;
  }

  public getRoot(accessCheck: AccessCheck): CoursesRootProvider {
    return new CoursesRootProvider(
      null, 
      this.coursesRoot, 
      0,
      [],
      accessCheck.step(this.coursesRoot),
      { baseUrl: this.baseUrl }
    );
  }
}
