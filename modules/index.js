// "use strict";
//禁止严格模式
(function () {
	//兼容Object.assign
	if (typeof Object.assign != "function") {
		Object.assign = function (target) {
			if (target === undefined || target === null) {
				throw new TypeError("Cannot convert undefined or null to object");
			}
			var output = Object(target);
			for (var index = 1; index < arguments.length; index++) {
				var source = arguments[index];
				if (source !== undefined && source !== null) {
					for (var nextKey in source) {
						if (source.hasOwnProperty(nextKey)) {
							output[nextKey] = source[nextKey];
						}
					}
				}
			}
			return output;
		};
	}
	Object.isEmpty = function (obj) {
		return Object.keys(obj).length == 0;
	};
})(typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);

(function (self) {
	/**!
	 * url-search-params-polyfill
	 *
	 * @author Jerry Bendy (https://github.com/jerrybendy)
	 * @licence MIT
	 */
	//兼容ie、Safari 10.0的地址解析
	var nativeURLSearchParams = (function () {
			// #41 Fix issue in RN
			try {
				if (self.URLSearchParams && new self.URLSearchParams("foo=bar").get("foo") === "bar") {
					return self.URLSearchParams;
				}
			} catch (e) {}
			return null;
		})(),
		isSupportObjectConstructor = nativeURLSearchParams && new nativeURLSearchParams({a: 1}).toString() === "a=1",
		// There is a bug in safari 10.1 (and earlier) that incorrectly decodes `%2B` as an empty space and not a plus.
		decodesPlusesCorrectly = nativeURLSearchParams && new nativeURLSearchParams("s=%2B").get("s") === "+",
		__URLSearchParams__ = "__URLSearchParams__",
		// Fix bug in Edge which cannot encode ' &' correctly
		encodesAmpersandsCorrectly = nativeURLSearchParams
			? (function () {
					var ampersandTest = new nativeURLSearchParams();
					ampersandTest.append("s", " &");
					return ampersandTest.toString() === "s=+%26";
			  })()
			: true,
		prototype = URLSearchParamsPolyfill.prototype,
		iterable = !!(self.Symbol && self.Symbol.iterator);

	if (nativeURLSearchParams && isSupportObjectConstructor && decodesPlusesCorrectly && encodesAmpersandsCorrectly) {
		return;
	}

	/**
	 * Make a URLSearchParams instance
	 *
	 * @param {object|string|URLSearchParams} search
	 * @constructor
	 */
	function URLSearchParamsPolyfill(search) {
		search = search || "";

		// support construct object with another URLSearchParams instance
		if (search instanceof URLSearchParams || search instanceof URLSearchParamsPolyfill) {
			search = search.toString();
		}
		this[__URLSearchParams__] = parseToDict(search);
	}

	/**
	 * Appends a specified key/value pair as a new search parameter.
	 *
	 * @param {string} name
	 * @param {string} value
	 */
	prototype.append = function (name, value) {
		appendTo(this[__URLSearchParams__], name, value);
	};

	/**
	 * Deletes the given search parameter, and its associated value,
	 * from the list of all search parameters.
	 *
	 * @param {string} name
	 */
	prototype["delete"] = function (name) {
		delete this[__URLSearchParams__][name];
	};

	/**
	 * Returns the first value associated to the given search parameter.
	 *
	 * @param {string} name
	 * @returns {string|null}
	 */
	prototype.get = function (name) {
		var dict = this[__URLSearchParams__];
		return this.has(name) ? dict[name][0] : null;
	};

	/**
	 * Returns all the values association with a given search parameter.
	 *
	 * @param {string} name
	 * @returns {Array}
	 */
	prototype.getAll = function (name) {
		var dict = this[__URLSearchParams__];
		return this.has(name) ? dict[name].slice(0) : [];
	};

	/**
	 * Returns a Boolean indicating if such a search parameter exists.
	 *
	 * @param {string} name
	 * @returns {boolean}
	 */
	prototype.has = function (name) {
		return hasOwnProperty(this[__URLSearchParams__], name);
	};

	/**
	 * Sets the value associated to a given search parameter to
	 * the given value. If there were several values, delete the
	 * others.
	 *
	 * @param {string} name
	 * @param {string} value
	 */
	prototype.set = function set(name, value) {
		this[__URLSearchParams__][name] = ["" + value];
	};

	/**
	 * Returns a string containg a query string suitable for use in a URL.
	 *
	 * @returns {string}
	 */
	prototype.toString = function () {
		var dict = this[__URLSearchParams__],
			query = [],
			i,
			key,
			name,
			value;
		for (key in dict) {
			name = encode(key);
			for (i = 0, value = dict[key]; i < value.length; i++) {
				query.push(name + "=" + encode(value[i]));
			}
		}
		return query.join("&");
	};

	// There is a bug in Safari 10.1 and `Proxy`ing it is not enough.
	var forSureUsePolyfill = !decodesPlusesCorrectly;
	var useProxy = !forSureUsePolyfill && nativeURLSearchParams && !isSupportObjectConstructor && self.Proxy;
	var propValue;
	if (useProxy) {
		// Safari 10.0 doesn't support Proxy, so it won't extend URLSearchParams on safari 10.0
		propValue = new Proxy(nativeURLSearchParams, {
			construct: function (target, args) {
				return new target(new URLSearchParamsPolyfill(args[0]).toString());
			},
		});
		// Chrome <=60 .toString() on a function proxy got error "Function.prototype.toString is not generic"
		propValue.toString = Function.prototype.toString.bind(URLSearchParamsPolyfill);
	} else {
		propValue = URLSearchParamsPolyfill;
	}
	/*
	 * Apply polifill to global object and append other prototype into it
	 */
	Object.defineProperty(self, "URLSearchParams", {
		value: propValue,
	});

	var USPProto = self.URLSearchParams.prototype;

	USPProto.polyfill = true;

	/**
	 *
	 * @param {function} callback
	 * @param {object} thisArg
	 */
	USPProto.forEach =
		USPProto.forEach ||
		function (callback, thisArg) {
			var dict = parseToDict(this.toString());
			Object.getOwnPropertyNames(dict).forEach(function (name) {
				dict[name].forEach(function (value) {
					callback.call(thisArg, value, name, this);
				}, this);
			}, this);
		};

	/**
	 * Sort all name-value pairs
	 */
	USPProto.sort =
		USPProto.sort ||
		function () {
			var dict = parseToDict(this.toString()),
				keys = [],
				k,
				i,
				j;
			for (k in dict) {
				keys.push(k);
			}
			keys.sort();

			for (i = 0; i < keys.length; i++) {
				this["delete"](keys[i]);
			}
			for (i = 0; i < keys.length; i++) {
				var key = keys[i],
					values = dict[key];
				for (j = 0; j < values.length; j++) {
					this.append(key, values[j]);
				}
			}
		};

	/**
	 * Returns an iterator allowing to go through all keys of
	 * the key/value pairs contained in this object.
	 *
	 * @returns {function}
	 */
	USPProto.keys =
		USPProto.keys ||
		function () {
			var items = [];
			this.forEach(function (item, name) {
				items.push(name);
			});
			return makeIterator(items);
		};

	/**
	 * Returns an iterator allowing to go through all values of
	 * the key/value pairs contained in this object.
	 *
	 * @returns {function}
	 */
	USPProto.values =
		USPProto.values ||
		function () {
			var items = [];
			this.forEach(function (item) {
				items.push(item);
			});
			return makeIterator(items);
		};

	/**
	 * Returns an iterator allowing to go through all key/value
	 * pairs contained in this object.
	 *
	 * @returns {function}
	 */
	USPProto.entries =
		USPProto.entries ||
		function () {
			var items = [];
			this.forEach(function (item, name) {
				items.push([name, item]);
			});
			return makeIterator(items);
		};

	if (iterable) {
		USPProto[self.Symbol.iterator] = USPProto[self.Symbol.iterator] || USPProto.entries;
	}

	function encode(str) {
		var replace = {
			"!": "%21",
			"'": "%27",
			"(": "%28",
			")": "%29",
			"~": "%7E",
			"%20": "+",
			"%00": "\x00",
		};
		return encodeURIComponent(str).replace(/[!'\(\)~]|%20|%00/g, function (match) {
			return replace[match];
		});
	}

	function decode(str) {
		return str.replace(/[ +]/g, "%20").replace(/(%[a-f0-9]{2})+/gi, function (match) {
			return decodeURIComponent(match);
		});
	}

	function makeIterator(arr) {
		var iterator = {
			next: function () {
				var value = arr.shift();
				return {done: value === undefined, value: value};
			},
		};

		if (iterable) {
			iterator[self.Symbol.iterator] = function () {
				return iterator;
			};
		}

		return iterator;
	}

	function parseToDict(search) {
		var dict = {};

		if (typeof search === "object") {
			// if `search` is an array, treat it as a sequence
			if (isArray(search)) {
				for (var i = 0; i < search.length; i++) {
					var item = search[i];
					if (isArray(item) && item.length === 2) {
						appendTo(dict, item[0], item[1]);
					} else {
						throw new TypeError(
							"Failed to construct 'URLSearchParams': Sequence initializer must only contain pair elements"
						);
					}
				}
			} else {
				for (var key in search) {
					if (search.hasOwnProperty(key)) {
						appendTo(dict, key, search[key]);
					}
				}
			}
		} else {
			// remove first '?'
			if (search.indexOf("?") === 0) {
				search = search.slice(1);
			}

			var pairs = search.split("&");
			for (var j = 0; j < pairs.length; j++) {
				var value = pairs[j],
					index = value.indexOf("=");

				if (-1 < index) {
					appendTo(dict, decode(value.slice(0, index)), decode(value.slice(index + 1)));
				} else {
					if (value) {
						appendTo(dict, decode(value), "");
					}
				}
			}
		}

		return dict;
	}

	function appendTo(dict, name, value) {
		var val =
			typeof value === "string"
				? value
				: value !== null && value !== undefined && typeof value.toString === "function"
				? value.toString()
				: JSON.stringify(value);

		// #47 Prevent using `hasOwnProperty` as a property name
		if (hasOwnProperty(dict, name)) {
			dict[name].push(val);
		} else {
			dict[name] = [val];
		}
	}

	function isArray(val) {
		return !!val && "[object Array]" === Object.prototype.toString.call(val);
	}

	function hasOwnProperty(obj, prop) {
		return Object.prototype.hasOwnProperty.call(obj, prop);
	}
})(typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
(function (self) {
	//发送请求
	self.x = self.x || new Object();

	// 配置路径
	var Path = function (run) {
		this.root = this.urlParser("./").href;
		this.run = run || this.getPath(); //脚本运行路径
	};
	Path.prototype.urlParser = function (url) {
		//解析地址
		var parser = document.createElement("a");
		parser.href = url;
		return parser;
	};
	Path.prototype.getPath = function () {
		//获取当前脚本运行路径
		if (this.run) {
			return this.run;
		}
		var e = new Error("err");
		var stack = e.stack || e.sourceURL || e.stacktrace || "";
		var rgx = /(?:http|https|file):\/\/.*?\/.+?.js/;
		var src = (rgx.exec(stack) || [])[0] || "";
		return src;
	};
	Path.prototype.join = function () {
		//支持的路径：http、https、根路径/的绝对路径、相对路径
		if (!arguments.length) {
			return "";
		}
		var strList = [].slice.call(arguments);
		if (strList.length == 1) {
			if (strList[0] && strList[0][0] == ".") {
				return this.join(this.getPath(), strList[0]);
			} else {
				return strList[0];
			}
		}
		var _this_ = this;
		var url = _this_.urlParser(_this_.getPath()).href;
		if (strList[0] && strList[0][0] == "/") {
			//根目录
			url = _this_.urlParser("/").href; //获取当前绝对路径
		}
		strList.map(function (item) {
			if (/^(https{0,1}\:\/\/|ftp\:\/\/)/.test(item)) {
				//检测是否是http（s）、ftp路径
				url = item;
				return;
			}
			//检测是否相对路径./
			if (/^(\.+)\//.test(item) && /[^\/]$/.test(url)) {
				url = _this_.urlParser(url + "/../").href; //获取相对路径
			}
			url = _this_.urlParser(url + item).href;
		});

		(function () {
			//去除重复的/
			var isRe;
			function del() {
				isRe = false;
				url = url.replace(/(?<!(https{0,1}\:|ftp\:))(\/\/)/gm, function () {
					isRe = true;
					return "/";
				});
				return isRe;
			}
			while (del()) {}
		})();
		return url;
	};

	self.x.$path = new Path();

	(function () {
		function createXhr() {
			if (typeof XMLHttpRequest != "undefined") {
				return new XMLHttpRequest();
			} else if (typeof ActiveXObject != "undefined") {
				if (typeof arguments.callee.activeXString != "string") {
					var versions = ["MSXML2.XMLHttp.6.0", "MSXML2.XMLHttp.3.0", "MSXML2.XMLHttp"];
					var i, len;
					for (i = o, len = versions.length; i < len; i++) {
						try {
							new ActiveXObject(version[i]);
							arguments.callee.activeXString = version[i];
							break;
						} catch (ex) {
							//跳过
						}
					}
				}
				return new ActiveXObject(arguments.callee.activeXString);
			} else {
				throw new Error("NO XHR object available");
			}
		}

		function setParams(search, params) {
			search = new URLSearchParams(search);
			for (var key in params) {
				if (Object.hasOwnProperty.call(params, key)) {
					search.append(key, params[key]);
				}
			}
			return search.toString();
		}

		function setHeaders(xhr, headers) {
			/*
			var HeadersList = [
				//请求常用请求头
				"Accept",
				"Accept-Encoding",
				"Accept-Language",
				"Cache-Control",
				"Host",
				"Pragma",
				"Proxy-Connection",
				"Upgrade-Insecure-Requests",
				"User-Agent",
				//post请求常用请求头
				"Content-Type",
				"Content-Length",
				"Origin",
				"Referer",
			];
            */
			for (var key in headers) {
				if (Object.hasOwnProperty.call(headers, key)) {
					xhr.setRequestHeader(key, headers[key]);
				}
			}
		}
		function request(options) {
			if (!options || !options.url) {
				return Promise.reject("请求路径不能为空");
			}

			var defaultOptions = {
				url: null,
				method: "get",
				reqType: "json", //如果有发送file文件，需要发送表单格式数据（form）,仅post有效
				resType: "text", //json、text,默认text
				headers: {},
				params: {},
				data: {},
				async: true, //默认异步请求请求文件
			};

			options = JSON.parse(JSON.stringify(options)); //复制
			options = Object.assign(defaultOptions, options);
			var isSuccess = false; //请求成功
			var xhr = createXhr();
			var parser = x.$path.urlParser(options.url);

			var url = options.url;
			if (options) {
				if (options.params && !Object.isEmpty(options.params)) {
					url = url + "?" + setParams(parser.search, options.params);
				}
				new Map([
					[
						/post/i,
						function () {
							new Map([
								//post请求前处理数据
								[
									/json/,
									function () {
										options.headers["Content-type"] = "application/json";
										options.data = JSON.stringify(options.data);
									},
								],
								[
									/form/,
									function () {
										options.headers["Content-type"] = "application/x-www-form-urlencoded";
										var formData = new FormData();
										function objectToFormData(obj, namespace) {
											var formKey;

											for (var property in obj) {
												if (Object.hasOwnProperty.call(obj, property)) {
													if (obj[property] != null && obj[property] != undefined) {
														var key = isArray(obj) ? "[" + property + "]" : "." + property;
														if (namespace) {
															formKey = namespace + key;
														} else {
															formKey = property;
														}

														//递归处理参数
														if (typeof obj[property] === "object" && !(obj[property] instanceof File)) {
															objectToFormData(obj[property], formKey);
														} else {
															formData.append(formKey, obj[property]);
														}
													}
												}
											}
											return formData;
										}
										objectToFormData(options.data);
										options.data = formData;
									},
								],
							]).forEach(function (callback, type) {
								type.test(options.reqType) && callback();
							});
						},
					],
					[
						/get/i,
						function () {
							//get请求前处理数据
						},
					],
				]).forEach(function (callback, exp) {
					exp.test(options.method) && callback();
				});
			}
			return new Promise(function (resolve, reject) {
				xhr.onreadystatechange = function (a, b, c) {
					if (xhr.readyState === 4) {
						clearTimeout(timeoutObj);
						if ((xhr.status >= 200 && xhr.status <= 300) || xhr.status === 304) {
							//success
							isSuccess = true;
							var res = xhr.responseText;
							if (/json/i.test(options.resType)) {
								try {
									res = JSON.parse(xhr.responseText);
								} catch (err) {
									res = xhr.responseText;
								}
							}
							return resolve(res, xhr);
						} else {
							//error
							return reject(xhr, a, b, c);
						}
					}
				};
				xhr.open(options.method, url, options.async);
				if (options.headers) {
					setHeaders(xhr, options.headers);
				}
				xhr.send(options.data);
				//超时报错

				var timeoutObj;
				if (options && options.timeout) {
					timeoutObj = setTimeout(function () {
						!isSuccess && xhr.abort();
						reject(xhr);
					}, options.timeout);
				} else {
					xhr.ontimeout = function () {
						throw reject(xhr);
					};
				}
			}).catch(function (res) {
				return Promise.reject(res);
			});
		}

		self.x.$ajax = request; //导出
	})();

	(function () {
		var modules = new Map(); //资源库
		var waitList = new Map();
		self.x.$require = function (url) {
			if (!url) {
				return Promise.reject("请求地址不能为空");
			}
			if (arguments[1]) {
				var ret = [];
				argToArr(arguments).map(function (val) {
					ret.push(self.x.$require(val));
				});
				return Promise.all(ret);
			}
			url = self.x.$path.join(url);
			var code = modules.get(url);
			if (code) {
				if (code.data) {
					return Promise.resolve(code.data);
				}
				return Promise.resolve(code.req);
			}
			var req = self.x
				.$ajax({
					url: url,
				})
				.then(function (ret) {
					var _win_ = new Object();
					var $path = new Path(url);
					_win_.x = Object.assign({}, x, {
						$path: $path,
						$require: function (_URL_) {
							//主线程等待
							if (arguments[1]) {
								var ret = [];
								argToArr(arguments).map(function (val) {
									ret.push(require(val));
								});
								return Promise.all(ret);
							}
							return require(_URL_);
							function require(_URL_) {
								var wait = waitList.get(url) || [];
								var req = self.x.$require($path.join(_URL_));
								wait.push(req);
								waitList.set(url, wait);
								return req;
							}
						},
					});
					var module;
					try {
						module = self.x.globalEval({str: ret, obj: _win_, self: self}).module;
					} catch (err) {
						return Promise.reject(err);
					}
					function complete() {
						var _list_ = waitList.get(url) || [];
						var _len_ = _list_.length;
						//检测是否又加载其他模块
						return Promise.all(_list_)
							.then(function () {
								if ((waitList.get(url) || []).length == _len_) {
									modules.set(url, {data: module.exports});
									waitList.delete(url); //删除
									return module.exports;
								}
								return complete();
							})
							.catch(function (err) {
								return Promise.reject(err);
							});
					}
					return complete();
				})
				.catch(function (err) {
					waitList.delete(url);
					modules.delete(url);
					console.warn("脚本 " + url + " 运行错误：", err);
					return err;
				});
			modules.set(url, {
				req: req,
			});
			return req;
		};
	})();
	function isArray(val) {
		return !!val && "[object Array]" === Object.prototype.toString.call(val);
	}
	function argToArr(arg) {
		return Array.prototype.slice.call(arg);
	}
})(typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);

x.globalEval = function (globalThis) {
	//全局作用域执行eval
	if (!globalThis.self) {
		globalThis.self = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this;
	}
	if (globalThis.obj) {
		globalThis.bindStr = ".bind(globalThis.obj)";
	} else {
		globalThis.bindStr = "";
	}
	var module = {
		exports: null,
	};
	return {
		module: module,
		result: eval("(function(){globalThis=globalThis.self;" + globalThis.str + "}" + globalThis.bindStr + ")();"),
	};
};
//主函数
(function (self) {
	var require = self.x.$require;
	var path = self.x.$path;
	var _CONFIGPATH_ = "./config.js"; //配置文件路径
	function cloud(option) {
		var vm = this;
		vm.option = {};
		function initConfig(option) {
			var scriptPath = path.join(_CONFIGPATH_);
			if (option) {
				if (option.config) {
					option.config = path.join(path.root, option.config);
				}
			}
			vm.option = Object.assign(
				//底层默认配置路径
				{
					config: scriptPath,
				},
				option
			);
			var configPath = vm.option.config;
			return require(configPath).then(function (config) {
				var _path_ = config.path;
				_path_.root = path.join(scriptPath, _path_.root);
				_path_.bin = path.join(_path_.root, _path_.bin);
				_path_.entry = path.join(_path_.bin, _path_.entry);
				Object.assign(vm.option, config);
				return require(_path_.entry);
			});
		}
		function init(option) {
			initConfig(option).then(function (run) {
				run(vm);
			});
		}
		init(option);
	}
	self.cloud = cloud;
})(typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
