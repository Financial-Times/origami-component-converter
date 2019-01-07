import convertOptions from './convert-options.js'
import createResolver from './create-resolver.js'

export let resolve = createResolver(convertOptions.workingDirectory)
