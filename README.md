# kodim-cms

Content management system for the kodim.cz project.

## Migration

Rules for migration from the previous version of the CMS.

### Images

Previous image syntax:

```
![Alt text](assets/image.png){.fig .fig-XX}
```

Current image syntax:

```
::fig[Alt text]{src=assets/image.png size=XX}
```

Replace regex for full width pictures:

```
find: !\[([^\]]*)\]\(([^\)]*)\)$
replace: ::fig[$1]{src=$2}
```

Replace regex for images with size:

```
find: !\[([^\]]*)\]\(([^\)]*)\)\{.fig .fig-([0-9]+)\}
replace: ::fig[$1]{src=$2 size=$3}
```

### Terms

Previous term syntax:

```
<term cs="Czech" en="English">
```

Current term syntax:

```
:term{cs="Czech" en="English"}`
```

Replace regex for terms

```
find: <term cs="(.*)" en="(.*)">
replace: :term{cs="$1" en="$2"}
```

1. Adopt new `term` syntax
   Find: `<term cs="(.*)" en="(.*)">`
   Replace: `:term{cs="$1" en="$2"}`
1. Adopt new `var` syntax
   Find `<var>(.*)</var>`
   Replace `:var[$1]`
1. Rename all `assign.md` to `exercise.md`
   ```
   find . -name 'assign.md' | rename 's/assign\.md/exercise.md/'
   ```