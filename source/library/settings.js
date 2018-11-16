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

import importJson from './import-json.js'
let settings: Settings = importJson('settings.json')
export default settings
