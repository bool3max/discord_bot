'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _redis = require('redis');

var _redis2 = _interopRequireDefault(_redis);

var _bluebird = require('bluebird');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(0, _bluebird.promisifyAll)(_redis2.default.RedisClient.prototype);
(0, _bluebird.promisifyAll)(_redis2.default.Multi.prototype);

const db = _redis2.default.createClient({
	password: 'a45hgf678nopzx48712yy3cc0',
	string_numbers: false
});

exports.default = db;