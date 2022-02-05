this.x.$require("../utils/array/argToArr.js").then(function () {
	var props = [];
	//映射规则
	var tempDoc;
	var setTempDoc = function (data) {
		tempDoc = data;
	};
	var active = {
		txt: function (el) {
			el.obj.element.nodeValue = el.get(el.value, el.$);
		},
		attr: function (el) {
			var key = el.prop.key;
			if (/^\$.+/.test(key)) {
				key = key.substring(1, key.length);
				temp.element.addEventListener(key, value);
			} else {
				temp.element.setAttribute(key, value);
			}
			el.obj.element.setAttribute(key, el.get(el.value, el.$));
		},
		class: function (el) {
			var className = el.obj.element.className.split(" ");
			className[el.prop.index] = el.get(el.value, el.$);
			el.obj.element.className = className.join(" ");
		},
		id: function (el) {
			el.obj.element.id = el.get(el.value, el.$);
		},
		re: function (el) {
			var v = el.get(el.value);
			var d = v - el.oldValue;
			if (d == 0) {
				return;
			} else if (d < 0) {
				el.fragList.del(-d);
			} else {
				el.fragList.add(d);
			}
			el.oldValue = v;
		},
		arg: function () {},
	};
	//代理规则
	var checkRecord = {
		attr: function (record) {
			if (tempDoc.prop.key) {
				//涉及具体属性名称才代理
				record.push(tempDoc);
			}
		},
		txt: function (record) {
			record.push(tempDoc);
		},
		class: function (record) {
			record.push(tempDoc);
		},
		id: function (record) {
			record.push(tempDoc);
		},
		re: function (record) {
			tempDoc.oldValue = tempDoc.get(tempDoc.value);
			record.push(tempDoc);
		},
		arg: function (record) {},
	};

	function proxyMap(data, key, value) {
		var record = [];
		var isCover = false;
		var isChange = false;
		function changeArrPush(arr) {
			//数组变异方法
			// isCover = true;
			// isChange = false;
			if (
				props.some(function (v) {
					return v === arr;
				})
			) {
				return;
			}
			props.push(arr);
			["push", "pop", "shift", "unshift", "splice"].map(function (v) {
				var attr = arr[v];
				arr[v] = function () {
					if (isChange) {
						return attr;
					}
					isChange = true;
					eval(
						"attr.bind(arr)(" +
							new Array(Array._X_CLOUD_ARGTOARR(arguments).length)
								._X_CLOUD_ARRFILL(function (i) {
									this[i] = "arguments[" + i + "]";
								})
								.join(",") +
							")"
					);
					isChange = false;
					set(arr);
					return arr;
				};
			});
		}
		function isContain(obj) {
			//判断ele是否存在
			if (obj.obj && obj.obj.element) {
				return document.body.contains(obj.obj.element);
			}
			return true;
		}
		function set(v) {
			if (isChange) {
				value = v;
				return;
			}
			isCover = true;
			value = v;
			var len = record.length;
			var el;
			for (var i = 0; i < len; i++) {
				el = record[i];
				if (!isContain(el)) {
					record.splice(i, 1);
					return;
				}
				active[el.prop.type] && active[el.prop.type](el);
			}
			isCover = false;
		}
		function get() {
			if (!tempDoc.prop || isCover || isChange) {
				//重新设置时不进行绑定
				return value;
			}
			isCover = true;
			Array.isArray(value) && changeArrPush(value);
			tempDoc.prop && checkRecord[tempDoc.prop.type] && checkRecord[tempDoc.prop.type](record, tempDoc);
			isCover = false;
			return value;
		}
		Object.defineProperty(data, key, {
			get: get,
			set: set,
		});
	}
	function toProxy(data) {
		//局部对象this
		for (var key in data) {
			if (Object.hasOwnProperty.call(data, key)) {
				proxyMap(data, key, data[key]);
			}
		}
	}

	module.exports = [toProxy, setTempDoc];
});
