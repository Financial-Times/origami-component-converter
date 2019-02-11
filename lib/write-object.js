import * as fs from "fs-extra"

export default (filename, object) =>
	fs.outputJson(
		filename,
		object,
		{
			spaces: "\t"
		}
	)
