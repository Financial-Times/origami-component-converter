import * as yargs from "yargs"
import * as path from "path"

/**
 * Working directory resolve
 *
 * @param  {...string} paths the paths you'd like to resolve
 * @returns {string} the resolved path
 */
export let resolve = (...paths) =>
	path.resolve(yargs.argv.workingDirectory, ...paths)
