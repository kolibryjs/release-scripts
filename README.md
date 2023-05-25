# @kolibryjs/release-scripts

This repo is used to share release & publish scripts for the organisation. Scripts should be executed from the workspace root via `dynot scripts/release.ts`

## release

```ts
import { release } from '@kolibryjs/release-scripts'

release({
   // Name of the repo for CI link
   repo: 'release-scripts',
   // List of options. Choice will be available in following callback as `pkg`
   packages: ['release-scripts'],
   toTag: (pkg, version) =>
      pkg === 'kolibry' ? `v${version}` : `${pkg}@${version}`,
   // Not shared until we find a new changelog process
   logChangelog: pkg =>
      consolji.log(
         execSync(
            'git log $(git describe --tags --abbrev=0)..HEAD --oneline',
         ).toString(),
      ),
   generateChangelog: (pkg, version) => {},
   // use getPkgDir when not using a monorepo. Default to `packages/${pkg}`
   getPkgDir: pkg => '.',
})
```

## publish

```ts
import { publish } from '@kolibryjs/release-scripts'

publish({
   // Used when tag is not `pkg@version`
   defaultPackage: 'release-scripts',
   // use getPkgDir when not in a monorepo. Default to `packages/${pkg}`
   getPkgDir: pkg => '.',
})
```
