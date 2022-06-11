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
            link: 'kodim-cms-test-banany',
            title: 'Digitální flambované banány',
            path: '/kurzy/kodim-cms-test-banany',
            fsPath: '/home/podlomar/work/kodim.cz/kodim-cms-test-content/kurzy/kodim-cms-test-banany',
            repository: {
              originUrl: 'https://github.com/podlomar/kodim-cms-test-banany.git',
              branch: 'main',
              secret: 'xxx',
              baseUrl: 'https://github.com/podlomar/kodim-cms-test-banany',
              entryFsPath: '/home/podlomar/work/kodim.cz/kodim-cms-test-content/kurzy/kodim-cms-test-banany'
            },
            authors: [],
            draft: false,
            access: 'public',
            props: {
              image: 'intro-image.svg',
              lead: 'V tomto kurzu se naučíte přípravit výborné flambované banány z nul a jedniček'
            },
            subEntries: [
              {
                nodeType: 'broken',
                link: 'priprava',
                title: 'priprava',
                path: '/kurzy/kodim-cms-test-banany/priprava',
                fsPath: '/home/podlomar/work/kodim.cz/kodim-cms-test-content/kurzy/kodim-cms-test-banany/priprava',
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