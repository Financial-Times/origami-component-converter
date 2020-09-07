import path from "path"

/**
 * Take a path such as `./../thing` and return `./thing`
 * @param {string} name the path to normalise
 * @returns {string} the normalised path
 */
export let normalize = name => {
	// bare imports don't need to be normalised
	if (name.startsWith(".")) {
		// node's path.normalize will rewrite "./lol" to "lol"
		let normalized = path.normalize(name)
		// if it still starts with a dot, return it
		// otherwise, return "./thing" so it isn't interpreted as a bare import
		return normalized.startsWith(".")
			? normalized
			: // import syntax always uses unix-style slashes
			"./" + normalized
	}

	return name
}

/**
 * Perform default replacements for occ rewrite.
 * Given a filename, replace `"main.js"` with `"browser.js"` or
 * `src` with `dist`
 * @typedef {function} replace
 * @param {string} name import string to perform replacement on
 * @returns {string} the fixed name
 */
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

/**
 * @typedef {Object.<string, string>} Aliases
 */

/**
 * Rewrite imports from what is needed by npm from aliases, and the default
 * replacements provided by `replace`
 * @param {string} name import name to rewrite
 * @param {Aliases} aliases the aliases to rewrite with `{from: to}`
 * @param {replace} replacer function which replaces import and require calls
 * @returns {string} the fixed name
 */
export let rewrite = (name, aliases, replacer = replace) => {
	name = normalize(name)

	let isRelative = name.startsWith(".")
	let isBare = !isRelative

	if (isBare) {
		// in our bower code, anything before the first slash is the module's name
		let match = name.match(/([^/]+)(.*)/)
		if (match) {
			let [, root, path] = match
			// aliases are `{from: to}`, so a key matching a bare import's root is an alias for that package
			let pkg = Object.keys(aliases).find(pkg => root === pkg)
			if (pkg){
				name = `${aliases[pkg]}${path || ""}`
			}
		}
	}

	name = replacer(name)

	return name
}

/*
 * Rewrite import statements and require calls.
 */
export default ({aliases, replacer = undefined}) => ({types}) => {
	return {
		visitor: {
			CallExpression(path) {
				if (path.node.callee.name !== "require") {
					return
				}
				let [source] = path.get("arguments")
				source.replaceWith(
					types.stringLiteral(rewrite(source.node.value, aliases, replacer))
				)
			},
			ImportDeclaration(path) {
				let source = path.get("source")
				source.replaceWith(
					types.stringLiteral(rewrite(source.node.value, aliases, replacer))
				)
			},
		},
	}
}
