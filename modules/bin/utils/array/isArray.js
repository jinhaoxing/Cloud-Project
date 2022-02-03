!Array.isArray &&
	(Array.isArray = function (val) {
		return !!val && "[object Array]" === Object.prototype.toString.call(val);
	});
