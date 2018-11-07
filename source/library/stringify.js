// @flow
export default (thing: any): string =>
	JSON.stringify(
		// object to stringify
		thing,
		// function to use to print (null for nothing)
		null,
		// spacing to use
		2
	)
	// plus a wee newline before EOF
	+ '\n'
