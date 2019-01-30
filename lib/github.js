import makeFetch from "make-fetch-happen"
import semver from "semver"
import tar from "tar"
import * as components from "./components.js"
import {mkdirp, outputFile} from "fs-extra"
import log from "./log.js"
import * as workingDirectory from "./working-directory.js"
let settings = require("../config/settings.json")

let logResponseCode = response => {
	log(response.status)
	return response
}

let checkResponseGoodness = response =>
	response.ok || response.status === 304
		? response
		: Promise.reject(response)

export let getBranchTarballUri = (
	componentName,
	branch,
	githubOrganisation = settings.githubOrganisation
) =>
	[
		"https://github.com",
		githubOrganisation,
		componentName,
		"archive",
		`${branch}.tar.gz`
	].join("/")

let getComponentApiUri = (
	componentName,
	version,
	githubOrganisation = settings.githubOrganisation
) => [
		"https://api.github.com/repos",
		githubOrganisation,
		componentName,
		"releases",
		version ? `tags/v${version}` : "latest"
	].join("/")

let getComponentTagsUri = (
	componentName,
	githubOrganisation = settings.githubOrganisation
) => [
	"https://api.github.com/repos",
	githubOrganisation,
	componentName,
	"tags"
].join("/")

// memo
let getAuthorization = () => {
	let authorization
	return (function() {
		authorization ||
			(authorization = `token ${process.env.OCC_GITHUB_TOKEN || ""}`)
		return authorization
	}())
}

let getCacheManager = () => workingDirectory.resolve(".github-fetch-cache")

let getContentsOfUri = uri =>
	makeFetch(uri, {
		headers: {
			authorization: getAuthorization()
		},
		cacheManager: getCacheManager()
	})

export let getLatestReleaseMetadata = async (componentName, version) => {
	if (!version) {
		let tags = (
			await getContentsOfUri(url)
				.then(logResponseCode)
				.then(checkResponseGoodness)
				.then(response => response.json())
		)
			.map(tag => tag.name)
			.filter(tag => !semver.prerelease(tag))

		version = tags.length && semver.rsort(tags)[0].slice(1)
	}
	let url = getComponentApiUri(componentName, version)

	log(
		`gonna try getting metadata for ${componentName}${
			version ? `@${version}` : ""
		} from ${url}`
	)

	return getContentsOfUri(url)
		.then(logResponseCode)
		.then(checkResponseGoodness)
		.then(response => response.json())
		.then(data => {
			return (
				data && {
					version: semver.clean(data.tag_name || ""),
					tarballUrl: data.tarball_url
				}
			)
		})
		.catch(async response => {
			let {message} = await response.json()
			let rateLimitResetDate = new Date(
				response.headers.get("x-ratelimit-reset") * 1000
			)
			console.error(
				`${componentName}:`,
				message,
				"ratelimit reset:",
				rateLimitResetDate.toLocaleTimeString()
			)
		})
}

export let extractTarballFromUri = async (uri, destination) => {
	let cwd = workingDirectory.resolve(destination)
	await mkdirp(cwd)
	return new Promise((yay, nay) =>
		getContentsOfUri(uri)
			.then(logResponseCode)
			.then(checkResponseGoodness)
			.then(response =>
				response.body.pipe(
					tar.extract({
						cwd,
						strip: 1,
						onentry: entry => log(entry.path)
					})
				)
			)
			.then(stream => {
				stream.on("finish", yay)
				stream.on("error", nay)
			})
			.catch(nay)
	)
}

export let getLatestRelease = async (componentName, requestedVersion) => {
	let metadata = await getLatestReleaseMetadata(componentName, requestedVersion)

	if (!metadata) {
		throw `got no release metadata for ${componentName}`
	}

	let componentDirectory = components.resolve(componentName)

	await mkdirp(componentDirectory)

	metadata.version &&
		(await outputFile(
			components.getVersionFilePath(componentName),
			metadata.version
		))

	log(
		`downloading ${componentName}@${metadata.version} from ${
			metadata.tarballUrl
		}`
	)

	return extractTarballFromUri(metadata.tarballUrl, componentDirectory)
}
