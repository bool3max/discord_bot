'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.default = mergeDefaults;
function mergeDefaults(userOptions, defaultOptions, mergeDeep = true) {
	//loops through defaultOptions and if userOptions doesn't have a prop that defaultOptions has, it adds it to userOptions
	//returns the modified userOptions

	for (let optionNameDefault in defaultOptions) {
		let optionValueDefault = defaultOptions[optionNameDefault];
		if (!userOptions.hasOwnProperty(optionNameDefault)) {
			userOptions[optionNameDefault] = optionValueDefault;
		} else if (mergeDeep && userOptions.hasOwnProperty(optionNameDefault) && typeof optionValueDefault === 'object' && !Array.isArray(optionValueDefault)) {
			for (let optionNameDefaultDeep in optionValueDefault) {
				let optionValueDefaultDeep = optionValueDefault[optionNameDefaultDeep];
				if (!userOptions[optionNameDefault].hasOwnProperty(optionNameDefaultDeep)) {
					userOptions[optionNameDefault][optionNameDefaultDeep] = optionValueDefaultDeep;
				}
			}
		}
	}
	return userOptions;
}