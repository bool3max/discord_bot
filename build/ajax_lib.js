'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = ajaxCall;

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _get_url_constructor = require('./get_url_constructor');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ajaxCall(initialURL, method = 'GET', data = undefined) {
    //only works in a browser environment (can work in node if u have the xhr2 lib, and it's globally defined as XMLHttpRequest)
    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.addEventListener('load', function () {
            //not using arrow functions here cuz of the scope
            if (this.readyState === 4 && this.status >= 200 && this.status < 300) {
                resolve(this.responseText);
            } else reject(new Error(`Ready state: ${ this.readyState }, statusCode: ${ this.status }, responseText: ${ this.responseText }`));
        });
        if (method === "GET") {
            let parsedURL = _url2.default.parse(initialURL);
            if ((parsedURL.query === '' || !parsedURL.query) && data) {
                let finalURL = (0, _get_url_constructor.url_constructor)(initialURL, data);
                request.open(method, finalURL);
            } else request.open(method, initialURL);
            request.send();
        } else {
            request.open(method, initialURL);
            request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
            request.send((0, _get_url_constructor.param_constructor)(data));
        }
    });
}