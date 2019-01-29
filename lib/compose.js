/**
 * right-to-left function composition. rightmost function can have any arity but
 * the rest gotta be unary.
 * @returns {any} any
 */
let compose = (...functions) => (...args) =>
	functions
		.slice(0, -1)
		.reduceRight(
			(result, fn) => fn(result),
			functions[functions.length - 1](...args)
		)

export default compose
