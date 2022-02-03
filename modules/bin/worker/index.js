var currentPath = ""; //配置路径
console.log("载入webworker自定义对象");
function worker(fun) {
	var self = this;
	var process = []; //线程数组
	function create(fun) {
		var url = window.URL.createObjectURL(new Blob([fun]));
		var wm = new Worker(url);
		wm.onmessage = function (ret) {
			console.log(ret);
		};
		// x.$require(x.$path.join(currentPath, url)).then(function(runStr){
		//     console.log(runStr)
		// })
		// process = new Worker(x.$path.join(currentPath, url));
	}
	0;
	create("(" + fun.toString() + ")()");
}
module.exports = function (fm, name) {
	fm[name];
};