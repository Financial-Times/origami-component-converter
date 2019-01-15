/**
 * @typedef {[string, string]} Entry
 */

/**
 * @typedef {Object.<string, string>} Dictionary
 */

/**
 * @param {Dictionary} dictionary the dictionary to clone
 * @returns {Dictionary} a fresh dictionary
 */
export function clone(dictionary) {
	/**
	 * @type {Dictionary}
	 */
	let next = {}

	for (let key in dictionary) {
		next[key] = dictionary[key]
	}

	return next
}

/**
 * Merge two or more dictionaries
 *
 * @param {Dictionary} a a dictionary
 * @param {...Dictionary} rest more dictionaries
 * @returns {Dictionary} a fresh dictionary
 */
export function merge(a, ...rest) {
	let object = clone(a)

	rest.forEach(dictionary => {
		for (let key in dictionary) {
			object[key] = dictionary[key]
		}
	})

	return object
}

/**
 * Get a [key, value] array for a dictionary
 *
 * @param {Dictionary} dictionary
 * @returns {Entry[]}
 */
export function entries(dictionary) {
	/**
	 * @type {Entry[]}
	 */
	let result = []

	for (let key in dictionary) {
		result.push([key, dictionary[key]])
	}

	return result
}

/**
 * Get array of dictionary's keys
 *
 * @param {Dictionary} dictionary
 * @returns {string[]}
 */
export function keys(dictionary) {
	let result = []

	for (let key in dictionary) {
		result.push(key)
	}

	return result
}

/**
 * Get array of dictionary's values
 *
 * @param {Dictionary} dictionary
 * @returns {string[]}
 */
export function values(dictionary) {
	let result = []

	for (let key in dictionary) {
		result.push(dictionary[key])
	}

	return result
}

/**
 * Reduce the contents of a dictionary to a single value
 *
 * @template Result
 * @param {(result: Result, value: string, key: string) => Result} fn
 * @param {Dictionary} dictionary
 * @param {Result} initialValue
 * @returns {Result}
 */
export let reduce = (fn, dictionary, initialValue) => {
	let result = initialValue

	for (let key in dictionary) {
		result = fn(result, dictionary[key], key)
	}

	return result
}
