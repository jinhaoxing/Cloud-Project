module.exports = function (str, globalThis) {
	//注入
	return eval(str);
};
