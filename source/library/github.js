// @flow
// using make-fetch-happen because it was already in the tree
import makeFetch from 'make-fetch-happen'
import semver from 'semver'
import tar from 'tar'
import * as components from './components.js'
import {
	mkdirp,
	outputFile
} from 'fs-extra'
import {https} from 'follow-redirects'
import log from './log.js'
import getStream from 'get-stream'
import Url from 'url'
import args from './args.js'
import * as workingDirectory from './working-directory.js'

type ReleaseMetadata = {
	version: string,
	tarballUrl: string
}

let fetch = makeFetch.defaults({
	cacheManager: workingDirectory.resolve('github-fetch-cache')
})

let getComponentApiUri = (componentName: string): string =>
	`https://api.github.com/repos/${args.organisation}/${componentName}/releases/latest`

// memo
let getAuthorization = () => {
	let authorization
	return (function () {
		authorization || (
			authorization = `token ${process.env.GITHUB_TOKEN || ''}`
		)
		return authorization
	}())
}

export let getLatestReleaseMetadata = (componentName: string): Promise<?ReleaseMetadata> => {
	let url = getComponentApiUri(componentName)
	let authorization = getAuthorization()

	return fetch(url, {
		headers: {authorization}
	})
		.then(response => (log(response.status), response))
		.then(response => response.ok || response.status === 304 ? response : Promise.reject(response))
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


export let getLatestRelease = async (componentName: string): Promise<void> => {
	let releaseMetadata = await getLatestReleaseMetadata(componentName)

	if (!releaseMetadata) {
		throw `got no release metadata for ${componentName}`
	}

	let {
		version,
		tarballUrl
	} = releaseMetadata

	let componentDirectory = components.resolve(componentName)

	await mkdirp(componentDirectory)

	await outputFile(
		components.getVersionFilePath(componentName),
		version
	)

	log(`downloading ${componentName}@${version} from ${tarballUrl}`)

	let authorization = getAuthorization()

	let requestOptions = {
		...Url.parse(tarballUrl),
		headers: {
			authorization,
			'user-agent': '@chee/o-npm v0.0.1'
		}
	}

	await new Promise((yay, nay) => {
		https.get(requestOptions, response => {
			log(response.statusCode)
			if (response.statusCode >= 400) {
				nay(getStream(response))
			}
			response.pipe(tar.extract({
				cwd: componentDirectory,
				newer: true,
				strip: 1,
				onentry: entry => log(entry.path)
			}))
				.on('finish', yay)
				.on('error', nay)
		})
			.on('error', nay)
	})
}
