import fs from "fs-extra"
import {resolve as resolvePath} from "path"

/**
 * @typedef {import('./npm').NpmManifest} NpmManifest
 */

/**
 * Create the .npmignore file
 *
 * @param {string} componentDirectory the directory of the component
 * @param {Promise.<NpmManifest>} manifestPromise a promise resolving to a pre-cleaned manifest
 * @returns {Promise<void>} to resolve when done
 */
export async function create(componentDirectory, manifestPromise) {
	let gitIgnorePath = resolvePath(componentDirectory, ".gitignore")
	let npmIgnorePath = resolvePath(componentDirectory, ".npmignore")
	let manifestIgnoreEntries = (await manifestPromise).ignore || []

	let gitIgnore = await fs.readFile(gitIgnorePath, "utf-8").catch(() => "")

	await fs.appendFile(npmIgnorePath, manifestIgnoreEntries.join("\n").concat(gitIgnore))
}
