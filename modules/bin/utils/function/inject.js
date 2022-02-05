this.x.$require("../array/index.js").then(function () {
	Function.prototype._X_CLOUD_INJECT = function (globalThis) {
		//注入
		globalThis = globalThis || {};
		globalThis._data_ = {};
		var runStr =
			"(" +
			(function (fun) {
				return fun.toString().replace(/((?!\().)*(((?!(\{|\=\>)).)*)(\{|\=\>)([\s\S]*)/, function () {
					return (
						"function"+arguments[2]+"{(" +
						function () {
							globalThis.proxy({
								get: function (str, $) {
									$ = $ || 0;
									if (/[^(\s|\t)]/.test(str)) {
										str && eval("str =" + str);
										return str;
									}
								}.bind(globalThis._data_),
								set: function (str, val) {
									if (/[^(\s|\t)]/.test(str)) {
										str && typeof val != "undefined" && eval(str + "=" + val);
									}
								}.bind(globalThis._data_),
							});
						}.toString() +
						")();globalThis=globalThis.data" +
						arguments[6]
					);
				});
			})(this) +
			").bind(globalThis._data_);";
		return function () {
			return globalThis.run(
				eval(
					"globalThis.eval(runStr,globalThis)(" +
						new Array(Array._X_CLOUD_ARGTOARR(arguments).length)
							._X_CLOUD_ARRFILL(function (i) {
								this[i] = "arguments[" + i + "]";
							})
							.join(",") +
						")"
				)
			);
		}.bind(this);
	};
});
