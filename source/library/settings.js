// @flow

export type Settings = {
	/** the name of the github organisation to fetch from */
	githubOrganisation: string,
	/** the name of the npm organisation to publish under */
	npmOrganisation: string,
	/** oh bower registries to have a look at */
	bowerRegistries: string[]
}

import importJson from './import-json.js'
let settings: Settings = importJson('config/settings.json')
export default settings
