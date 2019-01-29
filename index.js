#!/usr/bin/env node
global.require = require("esm")(module/*, options*/)
module.exports = require("./main.js")
