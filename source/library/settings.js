// @flow

export type Settings = {
	/** the name of the npm organisation to publish under */
	organisation: string,
	/** the directory components live in */
	componentsDirectory: string,
	/** oh bower registries to have a look at */
	registries: string[],
	/** prerelease tag
	    this can be `false` for no prerelease
			if included, the version will be `${version}-${organisation}${prerelease}`
	*/
	prerelease: string | false
}

import semver from 'semver'
import importJson from './import-json.js'
import read from './read-object.js'
import write from './write-object.js'

let settings: Settings = importJson('settings.json')

/** ooh it mutates a boi isn't that nasty */
let updateSettings = () =>
	read('settings.json').then(next => settings = next)

type SemverLevels = 'major' | 'minor' | 'patch'

export let bumpPrerelease = (level?: SemverLevels = 'patch'): Promise<void> => {
	if (!settings.prerelease) {
		return Promise.reject('it bad')
	}

	let prerelease = semver.inc(settings.prerelease, level)

	return write('settings.json', {
		...settings,
		prerelease
	})
		.then(updateSettings)
		.then(() => new Promise(resolve => setTimeout(resolve, 2000)))
}

export default settings
