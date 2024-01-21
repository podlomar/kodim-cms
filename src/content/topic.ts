import { ParentEntry } from 'filefish/indexer';
import { defineContentType } from 'filefish/content-type';
import { Cursor } from 'filefish/cursor';
import { 
  CourseContentType,
  CourseEntry,
  CourseNavItem,
  CourseSource,
  Organization,
  courseNavItem,
} from './course.js';
import { Result } from 'monadix/result';
import { BaseContent, buildBaseContent } from './base.js';
import { Indexer } from 'filefish/indexer';
import { Loader, LoadError } from 'filefish/loader';
import { KodimCmsIndexer } from '../cms-indexer.js';
import { createFolderNode } from 'fs-inquire/dist/fsnodes.js';

export type TopicData = {
  lead: string,
};

export interface Topic extends BaseContent, TopicData {
  courses: CourseNavItem[],
}

export interface TopicSource {
  name: string,
  title: string,
  lead: string,
  courses: CourseDef[],
}

export type TopicEntry = ParentEntry<TopicSource, CourseEntry, TopicData>;

export interface CourseDef {
  name: string;
  folder: string;
  topic: string | null;
  organization: Organization
  repo: {
    url: string;
    folder: string;
  } | null;
}

export const TopicContentType = defineContentType('kodim/topic', {
  async index(source: TopicSource, indexer: Indexer): Promise<TopicEntry> {
    const kodimCmsIndexer = indexer as KodimCmsIndexer;    
    const courseSources: CourseSource[] = source.courses.reduce(
      (acc: CourseSource[], def: CourseDef) => {
        const result = createFolderNode(def.folder);
        if (!result.isSuccess()) {
          return acc;
        }

        const folderNode = result.get();
        return [...acc, {
          name: def.name,
          folderNode,
          topic: def.topic,
          repo: def.repo,
          organization: def.organization,
        }];
      }, 
      [],
    );
    
    for (let i = 0; i < courseSources.length; i++) {
      const courseSource = courseSources[i];
      if (courseSource.repo === null) {
        continue;
      }

      kodimCmsIndexer.registerRepo(
        courseSource.repo.url,
        courseSource.repo.folder,
        [source.name, courseSource.name],
        CourseContentType,
      );
    }

    const data = {
      lead: source.lead,
    };

    const subEntries = await indexer.indexChildren(source.name, courseSources, CourseContentType);
    return {
      ...indexer.buildParentEntry(source.name, source, 'public', data, subEntries),
      title: source.title,
    };
  },

  async loadContent(
    cursor: Cursor<TopicEntry>, loader: Loader,
  ): Promise<Result<Topic, LoadError>>  {
    const entry = cursor.entry();
    return Result.success({
      ...buildBaseContent(cursor),
      lead: entry.attrs.lead,
      courses: cursor.children().map((c) => courseNavItem(c, loader)),
    });
  },
});
