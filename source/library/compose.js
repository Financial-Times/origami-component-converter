// @flow
/**
	right-to-left function composition. rightmost function can have any arity
	but the rest gotta be unary.
*/
let compose: $Compose = ((...functions) => (...args) =>
	functions
		.slice(0, -1)
		.reduceRight(
			(result, fn) => fn(result),
			functions[functions.length - 1](...args)
		): any)

export default compose
