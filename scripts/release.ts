import { execSync } from 'node:child_process'
import consolji from 'consolji'
import { release } from '../src'

release({
   repo: 'release-scripts',
   packages: ['release-scripts'],
   toTag: (_, version) => `v${version}`,
   logChangelog: () =>
      consolji.log(
         execSync(
            'git log $(git describe --tags --abbrev=0)..HEAD --oneline',
         ).toString(),
      ),
   generateChangelog: () => { },
   getPkgDir: () => '.',
})
