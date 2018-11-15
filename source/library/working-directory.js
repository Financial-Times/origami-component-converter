// @flow
import args from './args.js'
import createResolver from './create-resolver.js'

export let resolve = createResolver(args.workingDirectory)
