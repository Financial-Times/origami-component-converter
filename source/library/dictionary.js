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

export function each (fn: ((string, string) => void | any), dictionary: Dictionary): void {
	for (let key in dictionary) {
		fn(dictionary[key], key)
	}
}

export function eachKey (fn: ((string) => void | any), dictionary: Dictionary): void {
	for (let key in dictionary) {
		fn(key)
	}
}

export function eachValue (fn: ((string) => void | any), dictionary: Dictionary): void {
	for (let key in dictionary) {
		fn(dictionary[key])
	}
}

export let reduce = <Result>(fn: (Result, string, string) => Result, dictionary: Dictionary, initialValue: Result): Result => {
	let result = initialValue

	for (let key in dictionary) {
		result = fn(result, dictionary[key], key)
	}

	return result
}


export function filter (test: ((string, string) => boolean), dictionary: Dictionary): Dictionary {
	return reduce((dictionary, key, value) => {
		if (test(dictionary[key], key)) {
			dictionary[key] = value
		}

		return dictionary
	}, dictionary, {})
}

export function filterKeys (test: ((string) => boolean), dictionary: Dictionary): Dictionary {
	return filter(key => test(key), dictionary)
}

export function filterValues (test: ((string) => boolean), dictionary: Dictionary): Dictionary {
	return filter((_, value) => test(value), dictionary)
}
