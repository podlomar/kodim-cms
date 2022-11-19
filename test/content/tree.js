export default {
  nodeType: 'inner',
  link: 'kurzy',
  title: 'kurzy',
  path: '/kurzy',
  fsPath: '/home/podlomar/work/kodim.cz/kodim-cms-test-content/kurzy',
  repository: null,
  authors: [],
  draft: false,
  access: 'public',
  props: {
    divisions: [
      {
        title: 'Testovací kurzy',
        lead: 'Kurzy určené k testování CMS systému pro Kódím.cz',
        courses: [
          {
            nodeType: 'inner',
            link: 'zemepis',
            title: 'Zeměpis',
            path: '/kurzy/zemepis',
            fsPath: '/home/podlomar/work/kodim.cz/kodim-cms-test-content/kurzy/zemepis',
            repository: {
              originUrl: 'https://github.com/podlomar/zemepis.git',
              branch: 'main',
              secret: 'xxx',
              baseUrl: 'https://github.com/podlomar/zemepis',
              entryFsPath: '/home/podlomar/work/kodim.cz/kodim-cms-test-content/kurzy/zemepis'
            },
            authors: [],
            draft: false,
            access: 'public',
            props: {
              image: 'intro-image.svg',
              lead: 'V tomto kurzu se naučíte vše o naší matičce Zemi'
            },
            subEntries: [
              {
                nodeType: 'broken',
                link: 'neexistuje',
                title: 'neexistuje',
                path: '/kurzy/zemepis/neexistuje',
                fsPath: '/home/podlomar/work/kodim.cz/kodim-cms-test-content/kurzy/zemepis/neexistuje',
                repository: null,
                authors: [],
                draft: false,
                access: 'public'
              }
            ]
          }
        ]
      }
    ]
  },
  subEntries: [],
};