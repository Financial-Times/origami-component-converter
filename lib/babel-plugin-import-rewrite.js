import path from "path"

export let normalize = (name) => {
	if (name.startsWith(".")) {
		let normalized = path.normalize(name)
		return normalized.startsWith(".")
			? normalized
			: "./" + normalized
	}

	return name
}
{
	let expect = require("expect")

	expect(normalize("./x")).toBe("./x")
	expect(normalize("../x")).toBe("../x")
	expect(normalize("./../x")).toBe("../x")
	expect(normalize("./.././../y")).toBe("../../y")
}

export let replace = name => {
	let mainRegex = /^((?:\.\.\/)+)main(\.js)?$/
	let mainMatch = name.match(mainRegex)
	if (mainMatch) {
		return name.replace(mainRegex, "$1browser$2")
	}

	let srcRegex = /(.*)\/src\/(.*)/
	let srcMatch = name.match(srcRegex)
	if (srcMatch) {
		return name.replace(srcRegex, "$1/dist/$2")
	}

	return name
}
{
	let expect = require("expect")

	expect(replace("../../main.js")).toBe("../../browser.js")

	expect(replace("../../../main")).toBe("../../../browser")

	expect(replace("../src/lol")).toBe("../dist/lol")

	expect(replace("../src/lol")).toBe("../dist/lol")
}

export let rewrite = (name, aliases) => {
	name = normalize(name)

	let isRelative = name.startsWith(".")
	let isBare = !isRelative

	if (isBare) {
		let match = name.match(/([^/]+)(.*)/)
		if (match) {
			let [, root, path] = match
			Object.keys(aliases).find(pkg => root === pkg)
			let pkg = Object.keys(aliases).find(pkg => root === pkg)
			pkg && (name = `${aliases[pkg]}${path || ""}`)
		}
	}

	name = replace(name)

	return name
}
{
	let expect = require("expect")
	let aliases = {
		x: "@special/x"
	}

	expect(rewrite("x/lol", aliases)).toBe("@special/x/lol")

	expect(rewrite("y/main", aliases)).toBe("y/main")

	expect(rewrite("x/src/lol", aliases)).toBe("@special/x/dist/lol")

	expect(rewrite("x/src/monkey/lol", aliases)).toBe("@special/x/dist/monkey/lol")

	expect(rewrite("../../main.js", aliases)).toBe("../../browser.js")

	expect(rewrite("../../../main", aliases)).toBe("../../../browser")

	expect(rewrite("../src/lol", aliases)).toBe("../dist/lol")

	expect(rewrite("../src/lol", aliases)).toBe("../dist/lol")
}

export default ({aliases}) => ({types}) => {
	return {
		visitor: {
			CallExpression(path) {
				if (path.node.callee.name !== "require") return
				let [source] = path.get("arguments")
				source.replaceWith(
					types.stringLiteral(
						rewrite(
							source.node.value,
							aliases
						)
					)
				)
			},
			ImportDeclaration (path) {
				let source = path.get("source")
				source.replaceWith(
					types.stringLiteral(
						rewrite(
							source.node.value,
							aliases
						)
					)
				)
			}
		}
	}
}
