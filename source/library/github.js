// @flow
import makeFetch from 'make-fetch-happen'
import semver from 'semver'
import tar from 'tar'
import * as components from './components.js'
import {
	mkdirp,
	outputFile
} from 'fs-extra'
import log from './log.js'
import settings from './settings.js'
import * as workingDirectory from './working-directory.js'

type ReleaseMetadata = {
	version: string,
	tarballUrl: string
}

let logResponseCode = response => (
	log(response.status),
	response
)

let checkResponseGoodness = response =>
	response.ok || response.status === 304
		? response
		: Promise.reject(response)

export let getBranchTarballUri = (componentName: string, branch: string, githubOrganisation?: string = settings.githubOrganisation): string =>
	[
		'https://github.com',
		githubOrganisation,
		componentName,
		'archive',
		`${branch}.tar.gz`
	].join('/')

let getComponentApiUri = (componentName: string, version?: string, githubOrganisation?: string = settings.githubOrganisation): string =>
	[
		'https://api.github.com/repos',
		githubOrganisation,
		componentName,
		'releases',
		version
			? `tags/v${version}`
			: 'latest'
	].join('/')


// memo
let getAuthorization = () => {
	let authorization
	return (function () {
		authorization || (
			authorization = `token ${process.env.ON_GITHUB_TOKEN || ''}`
		)
		return authorization
	}())
}

let getCacheManager = () =>
	workingDirectory.resolve('.github-fetch-cache')

let getContentsOfUri = (uri: string) =>
	makeFetch(uri, {
		headers: {
			authorization: getAuthorization()
		},
		cacheManager: getCacheManager()
	})

export let getLatestReleaseMetadata = (componentName: string, version?: string): Promise<?ReleaseMetadata> => {
	let url = getComponentApiUri(componentName, version)

	log(
		`gonna try getting metadata for ${componentName}${version ? `@${version}` : ''} from ${url}`
	)

	return getContentsOfUri(url)
		.then(logResponseCode)
		.then(checkResponseGoodness)
		.then(response => response.json())
		.then(data => {
			return data && {
				version: semver.clean(data.tag_name || ''),
				tarballUrl: data.tarball_url
			}
		})
		.catch(async response => {
			let {message} = await response.json()
			let rateLimitResetDate = new Date(response.headers.get('x-ratelimit-reset') * 1000)
			console.error(
				`${componentName}:`,
				message,
				'ratelimit reset:',
				rateLimitResetDate.toLocaleTimeString()
			)
		})
}

export let extractTarballFromUri = async (uri: string, destination: string): Promise<void> => {
	let cwd = workingDirectory.resolve(destination)
	await mkdirp(cwd)
	return new Promise((yay, nay) =>
		getContentsOfUri(uri)
			.then(logResponseCode)
			.then(checkResponseGoodness)
			.then(response =>
				response.body.pipe(tar.extract({
					cwd,
					strip: 1,
					onentry: entry => log(entry.path)
				}))
			)
			.then(stream => {
				stream.on('finish', yay)
				stream.on('error', nay)
			})
			.catch(nay)
	)
}

export let getLatestRelease = async (componentName: string, requestedVersion?: string): Promise<void> => {
	let metadata = await getLatestReleaseMetadata(componentName, requestedVersion)

	if (!metadata) {
		throw `got no release metadata for ${componentName}`
	}

	let componentDirectory = components.resolve(componentName)

	await mkdirp(componentDirectory)

	metadata.version && await outputFile(
		components.getVersionFilePath(componentName),
		metadata.version
	)

	log(`downloading ${componentName}@${metadata.version} from ${metadata.tarballUrl}`)

	return extractTarballFromUri(metadata.tarballUrl, componentDirectory)
}
