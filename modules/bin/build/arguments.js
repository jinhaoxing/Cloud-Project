this.x.$require("../utils/array/index.js").then(function () {
	module.exports = function (arg) {
		return new Array(Array._X_CLOUD_ARGTOARR(arg).length)
			._X_CLOUD_ARR_FILL(function (i) {
				this[i] = "arguments[" + i + "]";
			})
			.join(",");
	};
});
