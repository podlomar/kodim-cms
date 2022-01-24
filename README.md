# kodim-cms
Content management system for the kodim.cz project.

## Migration from previous CMS version

1. Adopt new `term` syntax
   Find: `<term cs="(.*)" en="(.*)">`
   Replace: `:term{cs="$1" en="$2"}`
1. Rename all `assign.md` to `exercise.md`
   ```
   find . -name 'assign.md' | rename 's/assign\.md/exercise.md/'
   ```