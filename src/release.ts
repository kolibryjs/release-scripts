import semver from 'semver'
import color from '@nyxb/picocolors'
import { publint } from 'publint'
import { printMessage } from 'publint/utils'
import { consolji } from 'consolji'
import { confirm, select, text } from '@tyck/prompts'
import type { release as def } from './types'
import {
   args,
   getPackageInfo,
   getVersionChoices,
   isDryRun,
   run,
   runIfNotDry,
   step,
   updateVersion,
} from './utils'

export const release: typeof def = async ({
   repo,
   packages,
   logChangelog,
   generateChangelog,
   toTag,
   getPkgDir,
}) => {
   let targetVersion: string | undefined

   const selectedPkg: string
    = packages.length === 1
       ? packages[0]
       : (
             await select({
                message: 'Select package',
                options: packages.map(i => ({ value: i, label: i })),
             })
          ) as string

   if (!selectedPkg)
      return

   await logChangelog(selectedPkg)

   const { pkg, pkgPath, pkgDir } = getPackageInfo(selectedPkg, getPkgDir)

   const messages = await publint({ pkgDir })

   if (messages.length) {
      for (const message of messages) consolji.log(printMessage(message, pkg))
      const yes: boolean = (await confirm({
         message: `${messages.length} messages from publint. Continue anyway?`,
      })) as boolean
      if (!yes)
         process.exit(1)
   }

   if (!targetVersion) {
      const { release }: { release: string } = (await select({
         message: 'Select release type',
         options: getVersionChoices(pkg.version).map(i => ({ value: { release: i.value }, label: i.title })),
      })) as { release: string }

      if (release === 'custom') {
         const version: string = (await text({
            message: 'Input custom version',
            initialValue: pkg.version,
         })) as string
         targetVersion = version
      }
      else {
         targetVersion = release
      }
   }

   if (!semver.valid(targetVersion))
      throw new Error(`invalid target version: ${targetVersion}`)

   const tag = toTag(selectedPkg, targetVersion)

   if (targetVersion.includes('beta') && !args.tag)
      args.tag = 'beta'

   if (targetVersion.includes('alpha') && !args.tag)
      args.tag = 'alpha'

   const yes: boolean = (await confirm({
      message: `Releasing ${color.yellow(tag)} Confirm?`,
   })) as boolean

   if (!yes)
      return

   step('\nUpdating package version...')
   updateVersion(pkgPath, targetVersion)
   await generateChangelog(selectedPkg, targetVersion)

   const { stdout } = await run('git', ['diff'], { stdio: 'pipe' })
   if (stdout) {
      step('\nCommitting changes...')
      await runIfNotDry('git', ['add', '-A'])
      await runIfNotDry('git', ['commit', '-m', `release: ${tag}`])
      await runIfNotDry('git', ['tag', tag])
   }
   else {
      consolji.log('No changes to commit.')
      return
   }

   step('\nPushing to GitHub...')
   await runIfNotDry('git', ['push', 'origin', `refs/tags/${tag}`])
   await runIfNotDry('git', ['push'])

   if (isDryRun) {
      consolji.log('\nDry run finished - run git diff to see package changes.')
   }
   else {
      consolji.log(
         color.nicegreen(
        `
        Pushed, publishing should starts shortly on CI.
        https://github.com/kolibryjs/${repo}/actions/workflows/publish.yml`,
         ),
      )
   }
}
