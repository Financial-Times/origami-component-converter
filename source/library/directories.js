// @flow

import path from 'path'
import settings from './settings.js'

import root from './root'

export {root}

export let componentsDirectory = root(settings.componentsDirectory)

export let getComponentDirectory = (componentName: string): string =>
	path.resolve(
		componentsDirectory,
		componentName
	)
