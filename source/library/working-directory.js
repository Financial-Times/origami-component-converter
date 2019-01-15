// @flow
import yargs from 'yargs'
import createResolver from './create-resolver.js'

export let resolve = (...paths: string[]) => createResolver(yargs.argv.workingDirectory)(...paths)
