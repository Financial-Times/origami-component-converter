import path from "path"

let normalize = name => {
	if (name.startsWith("./..")) {
		return name.slice(2)
	}

	if (name.startsWith("./")) {
		return "./" + path.normalize(name)
	}

	return name
}

export default ({aliases}) => ({types}) => {
	let rewrite = name => {
		name = normalize(name)

		let isRelative = name.startsWith(".")
		let isBare = !isRelative

		if (isBare) {
			let match = name.match(/([^/]+)(.*)/)
			if (match) {
				let [, root, path] = match
				for (let pkg in aliases) {
					if (root === pkg) {
						return `${aliases[pkg]}${path || ""}`
					}
				}
			}
			return name
		}

		if (isRelative) {
			if (name.match(/^\.\.\/main(?:\.js)?$/)) return "../browser"
			if (name.match(/\/src\//)) {
				return name.replace(/(.*)\/src\/(.*)/, "$1/dist/$2")
			}
		}

		return name
	}

	return {
		visitor: {
			CallExpression(path) {
				if (path.node.callee.name !== "require") return
				let [source] = path.get("arguments")
				source.replaceWith(types.stringLiteral(rewrite(source.node.value)))
			},
			ImportDeclaration (path) {
				let source = path.get("source")
				source.replaceWith(types.stringLiteral(rewrite(source.node.value)))
			}
		}
	}
}
