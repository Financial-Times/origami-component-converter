export default function(size, items) {
	let array = Array.from(items)

	let groups = []

	while (array.length) {
		groups.push(array.splice(0, size))
	}

	for (let count = 0; count < array.length; count += size) {
		groups.push(array.splice(0, size))
	}

	return groups
}
