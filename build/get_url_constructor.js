'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.url_constructor = url_constructor;
exports.param_constructor = param_constructor;
function url_constructor(initialURL, params) {
    let final = initialURL;
    if (!initialURL.endsWith('?')) final += '?'; //if the url doesn't already end with a '?', we'll add one

    for (let val in params) {
        final += `${ val }=${ params[val] }&`;
    }
    final = final.substr(0, final.length - 1); //we remove the last '&' (that's always going to get added, since I had now way to check whether the object property was the last one in it)
    return final;
}
function param_constructor(params) {
    let final = '';
    for (let prop in params) {
        final += `${ prop }=${ params[prop] }&`;
    }
    final = final.substr(0, final.length - 1); //we remove the last '&'
    return final;
}