// @flow
import type {Dictionary} from '../types/dictionary.types'

type Pair = [string, string]

export default function entries (dictionary: Dictionary): Pair[] {
	let result = []

	for (let key in dictionary) {
		result.push([key, dictionary[key]])
	}

	return result
}
