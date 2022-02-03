// Function.prototype.getParams = function () {
// 	//获取方法参数名,该方法有问题
// 	if (typeof this !== "function") return [];
// 	var COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm;
// 	var code = this.toString().replace(COMMENTS, "");
// 	var ret;
// 	ret = _ana_(code.substring(code.indexOf("(") + 1, code.length), 1, "");
// 	return ret;
// };

// function _ana_(str, isEnd, ret) {
// 	//防止字符串中出现（
// 	function analyse(str, isEnd, ret) {
// 		//获取方法的参数或者向方法中注入代码
// 		str.replace(/(((?!\)|\().)*)([\(|\)])([\s\S]*)/, function () {
// 			if (arguments[3] == "(") {
// 				isEnd++;
// 			} else {
// 				isEnd--;
// 			}
// 			if (isEnd > 0) {
// 				ret = analyse(arguments[4], isEnd, ret + arguments[1]);
// 			} else {
// 				ret += arguments[1];
// 			}
// 		});
// 		return ret;
// 	}
// 	return analyse(str, isEnd, ret);
// }
