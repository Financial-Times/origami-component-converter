// @flow
export type Dictionary = {
	[key: string]: string
}

type Pair = [string, string]

export function clone (object: Dictionary): Dictionary {
	let next = new object.constructor

	for (let key in object) {
		next[key] = object[key]
	}

	return next
}

export function merge (a: Dictionary, ...rest: Dictionary[]): Dictionary {
	let object = clone(a)

	rest.forEach(dictionary => {
		for (let key in dictionary) {
			object[key] = dictionary[key]
		}
	})

	return object
}

export function entries (dictionary: Dictionary): Pair[] {
	let result = []

	for (let key in dictionary) {
		result.push([key, dictionary[key]])
	}

	return result
}

export function keys (dictionary: Dictionary): string[] {
	let result = []

	for (let key in dictionary) {
		result.push(key)
	}

	return result
}

export function values (dictionary: Dictionary): string[] {
	let result = []

	for (let key in dictionary) {
		result.push(dictionary[key])
	}

	return result
}

type Reducer = <Result>(Result, string, string) => Result

export let reduce = <Result>(fn: Reducer) => (dictionary: Dictionary, initialValue: Result): Result => {
	let result = initialValue

	for (let key in dictionary) {
		result = fn(result, dictionary[key], key)
	}

	return result
}
