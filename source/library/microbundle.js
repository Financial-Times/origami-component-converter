// @flow

import type {
	Dictionary
} from '../types/dictionary.types'

/** returns a string declaring modules that should not be included in bundle */
export let createExternalString = (dependencies: Dictionary = {}): string => {
	let names = Object.keys(dependencies)

	return names.length
		? ` --external ${names.join(',')}`
		: ''
}
