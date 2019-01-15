//

export default function flat(array) {
	return array.reduce(
		(array, item) => (Array.isArray(item) ? flat(item) : array.concat(item)),
		[]
	)
}
