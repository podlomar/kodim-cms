import { ChapterProvider } from "./content/chapter.js";
import { CoursesRoot, CoursesRootProvider, loadCoursesRoot } from "./content/content.js";
import { SuccessQuery } from "./content/query.js";

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

  public query(): SuccessQuery<CoursesRootProvider> {
    const provider = new CoursesRootProvider(
      null, 
      this.coursesRoot, 
      0,
      [],
      { baseUrl: this.baseUrl }
    );
    return new SuccessQuery<CoursesRootProvider>(provider);
  }

  // public query(access: Access): Query<CoursesRootNode> {
  //   return new SuccessQuery<CoursesRootNode>(access, this.coursesRootNode as CoursesRootNode);
  // }

  // public findNode(path: string): ContentNode | null {
  //   const links = path.split("/").slice(1);
  //   if (links[0] === "kurzy") {
  //     return this.coursesRootNode!.findNode(links.slice(1));
  //   }

  //   return null;
  // }
}
