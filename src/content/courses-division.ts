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

export interface Topic {
  name: string,
  title: string,
  lead: string,
  courses: CourseNavItem[],
};

export interface CoursesDivisionData {
  topics: TopicSource[],
  interest: string,
}

export interface CoursesDivision extends BaseContent {
  type: 'courses',
  interest: string,
  topics: Topic[],
};

export interface TopicSource {
  name: string,
  title: string,
  lead: string,
  courses: CourseDef[],
}

export interface CoursesDivisionSource {
  name: string,
  title: string,
  interest: string,
  topics: TopicSource[],
}

export type CoursesDivisionEntry = ParentEntry<
  CoursesDivisionSource,
  CourseEntry, 
  CoursesDivisionData
>;

export interface CourseDef {
  name: string;
  folder: string;
  topic: string | null;
  organization: Organization;
  repo: {
    url: string;
    folder: string;
  } | null;
  draft: boolean,
}

export const CoursesDivisionContentType = defineContentType('kodim/courses-division', {
  async index(
    source: CoursesDivisionSource, indexer: Indexer
  ): Promise<CoursesDivisionEntry> {
    const kodimCmsIndexer = indexer as KodimCmsIndexer;    
    const courseSources: CourseSource[] = [];
    for (const topicSource of source.topics) {
      for (const courseDef of topicSource.courses) {
        const result = createFolderNode(courseDef.folder);
        if (!result.isSuccess()) {
          continue;
        }

        const folderNode = result.get();
        courseSources.push({
          name: courseDef.name,
          folderNode,
          topic: courseDef.topic,
          repo: courseDef.repo,
          organization: courseDef.organization,
          draft: courseDef.draft,
        });
      }
    }
    
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
      type: 'courses' as const,
      topics: source.topics,
      interest: source.interest,
    };

    const subEntries = await indexer.indexChildren(
      source.name, courseSources, CourseContentType
    );
    
    return {
      ...indexer.buildParentEntry(source.name, source, 'public', data, subEntries),
      title: source.title,
    };
  },

  async loadContent(
    cursor: Cursor<CoursesDivisionEntry>, loader: Loader,
  ): Promise<Result<CoursesDivision, LoadError>>  {
    const entry = cursor.entry();
    const topics: Topic[] = [];
    for (const topicSource of entry.data.topics) {
      const courses = cursor.children()
        .filter((c) => c.entry().data.topic === topicSource.name && !c.entry().data.draft)
        .map((c) => courseNavItem(c, loader));
      
      topics.push({
        name: topicSource.name,
        title: topicSource.title,
        lead: topicSource.lead,
        courses,
      });
    }

    return Result.success({
      ...buildBaseContent(cursor),
      type: 'courses',
      topics,
      interest: entry.data.interest,
    });
  },
});
