export type PublicContent<Attrs extends {}> = {
  type: 'public',
} & Attrs;

export type FullContent<Attrs extends {}> = {
  type: 'full',
} & Attrs;

export type BrokenContent<Attrs extends {}> = {
  type: 'broken',
} & Attrs;

export abstract class Entry<PublicAttrs extends {}, FullAttrs extends PublicAttrs> {
  protected abstract getPublicAttrs(): PublicAttrs;
  protected abstract fetchFullAttrs(): Promise<FullAttrs>;

  public getPublicContent(): PublicContent<PublicAttrs> {
    return {
      type: 'public',
      ...this.getPublicAttrs(),
    }
  }

  public async fetchFullContent(): Promise<FullContent<FullAttrs>> {
    return {
      type: 'full',
      ...await this.fetchFullAttrs(),
    }
  }
}

export interface PublicCourseAttrs {
  readonly image: string;
  readonly lead: string;
}

export interface FullCourseAttrs extends PublicCourseAttrs {
  chapters: string[];
}

export class CourseEntry extends Entry<PublicCourseAttrs, FullCourseAttrs> {
  private readonly lead: string;
  private readonly image: string;
  private readonly chapters: string[];

  public constructor(lead: string, image: string, chapters: string[]) {
    super();
    this.lead = lead;
    this.image = image;
    this.chapters = chapters;
  }

  public getPublicAttrs(): PublicCourseAttrs {
    return {
      image: this.image,
      lead: this.lead,
    }
  }

  public async fetchFullAttrs(): Promise<FullCourseAttrs> {
    return {
      ...this.getPublicAttrs(),
      chapters: this.chapters,
    }
  }
}