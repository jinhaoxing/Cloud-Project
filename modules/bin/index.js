var self = this;
var require = x.$require;
var path = self.x.$path;
var entryJS = "index.js"; //默认所有第三方脚本入口文件名为index.js
var _BINCONFIGPATH_ = self.x.$path.join("./config.bin.js"); //配置文件路径
module.exports = function (vm) {
	function injectRequire() {
		//覆写require
		var resources = new Map();
		var obj = vm.option.resources;
		var task = [];
		//加载第三方js
		function check(key) {
			if (Object.hasOwnProperty.call(obj, key)) {
				var p = path.join(vm.option.path.root, "/", key, "/", entryJS);
				task.push(
					require(p).then(function () {
						resources.set(key, p); //存储路径
					})
				);
			}
		}
		for (var key in obj) {
			check(key);
		}
		x.$require = function (file) {
			//通过资源名称查找并转为资源路径，组件名称为配置信息的资源列表resources
			if (resources.has(file)) {
				return require(resources.get(file));
			}
			return require(file);
		};
		return Promise.all(task);
	}

	var fm = {}; //fm为框架内部私有全局对象
	function init() {
		var list = [];
		return require(_BINCONFIGPATH_).then(function (binConfig) {
			function check(key) {
				if (Object.hasOwnProperty.call(binConfig.script, key)) {
					var p = path.join(vm.option.path.bin, "/", key, "/", entryJS);
					list.push(
						require(p).then(function (run) {
							run && run(fm, key);
							return {key: key, value: run};
						})
					);
				}
			}
			for (var key in binConfig.script) {
				check(key);
			}
			return Promise.all(list);
		});
	}
	init().then(function () {
		injectRequire().then(function () {
			//加载完毕所有第三方插件
			self.x.$require("./frame.js").then(function (run) {
				run(fm,vm);
			});
		});
	});
};
