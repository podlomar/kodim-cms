import { CoursesRoot, CoursesRootProvider, loadCoursesRoot } from "./content/content.js";

export class KodimCms{
  public readonly baseUrl: string;
  private readonly coursesRoot: CoursesRoot;
  
  private constructor(baseUrl: string, coursesRoot: CoursesRoot) {
    this.baseUrl = baseUrl;
    this.coursesRoot = coursesRoot;
  }

  public static async load(contentFolder: string, baseUrl: string): Promise<KodimCms> {
    const root = await loadCoursesRoot(contentFolder, "kurzy");
    const cms = new KodimCms(baseUrl, root);
    return cms;
  }

  public getRoot(): CoursesRootProvider {
    return new CoursesRootProvider(
      null, 
      this.coursesRoot, 
      0,
      [],
      { baseUrl: this.baseUrl }
    );
  }
}
