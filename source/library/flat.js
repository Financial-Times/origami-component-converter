// @flow

export default function flat (array: Array<any>): Array<any> {
	return array.reduce((array, item) =>
		Array.isArray(item)
			? flat(item)
			: array.concat(item)
	, [])
}
