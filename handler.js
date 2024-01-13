'use strict';
const serverless = require("serverless-http");
const { app } = require("./index");
module.exports.file = serverless(app)