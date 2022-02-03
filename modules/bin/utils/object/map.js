Object.map = function (obj, fun) {
	for (var key in obj) {
		if (Object.hasOwnProperty.call(obj, key)) {
			fun(key, obj[key]);
		}
	}
};
