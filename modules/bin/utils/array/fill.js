Array.prototype._X_CLOUD_ARRFILL = function (fun) {
	if (typeof fun != "function") {
		return this.fill(fun);
	}
	var arr = new Array(this.length).fill(null);
	arr.map(
		function (v, i) {
			fun.bind(this)(i);
		}.bind(this)
	);
	return this;
};
