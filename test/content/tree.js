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
              },
              {
                nodeType: 'inner',
                link: 'evropa',
                title: 'Evropa',
                path: '/kurzy/zemepis/evropa',
                fsPath: '/home/podlomar/work/kodim.cz/kodim-cms-test-content/kurzy/zemepis/evropa',
                authors: [],
                draft: false,
                access: 'public',
                props: {
                  lead: 'Evropa je území vnímané buďto jako jeden ze šesti světadílů v jejich tradičních pojetích, nebo jako západní část Eurasie.'
                },
                repository: {
                  baseUrl: 'https://github.com/podlomar/zemepis',
                  branch: 'main',
                  entryFsPath: '/home/podlomar/work/kodim.cz/kodim-cms-test-content/kurzy/zemepis',
                  originUrl: 'https://github.com/podlomar/zemepis.git',
                  secret: 'xxx',
                },
                subEntries: [
                  {
                    nodeType: 'inner',
                    link: 'rakousko',
                    title: 'Rakousko',
                    path: '/kurzy/zemepis/evropa/rakousko',
                    access: 'public',
                    authors: [],
                    draft: false,
                    fsPath: '/home/podlomar/work/kodim.cz/kodim-cms-test-content/kurzy/zemepis/evropa/rakousko',
                    props: {
                      lead: 'Rakouská republika je vnitrozemská spolková republika ležící ve střední Evropě.',
                      num: 1,
                    },
                    repository: {
                      baseUrl: 'https://github.com/podlomar/zemepis',
                      branch: 'main',
                      entryFsPath: '/home/podlomar/work/kodim.cz/kodim-cms-test-content/kurzy/zemepis',
                      originUrl: 'https://github.com/podlomar/zemepis.git',
                      secret: 'xxx',
                    },
                    subEntries: [
                      {
                        nodeType: 'inner',
                        link: 'viden',
                        title: 'Vídeň (Wien)',
                        access: 'public',
                        path: '/kurzy/zemepis/evropa/rakousko/viden',
                        fsPath: '/home/podlomar/work/kodim.cz/kodim-cms-test-content/kurzy/zemepis/evropa/rakousko/viden',
                        authors: [],
                        draft: false,
                        props: {},
                        repository: {
                          baseUrl: 'https://github.com/podlomar/zemepis',
                          branch: 'main',
                          entryFsPath: '/home/podlomar/work/kodim.cz/kodim-cms-test-content/kurzy/zemepis',
                          originUrl: 'https://github.com/podlomar/zemepis.git',
                          secret: 'xxx',
                        },
                        subEntries: [],
                      },
                    ],
                  },
                ],
              }
            ]
          }
        ]
      }
    ]
  },
  subEntries: [],
};