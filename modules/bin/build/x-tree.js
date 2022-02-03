var v1 = "大括号";
var v2 = "中括号";
function createTree(exp, checkC) {
	this.exp = exp.replace(/\n/g, "");
	this.checkC = checkC;
	this.tree = new createNode(this.checkC); //创建根节点
	this.parse();
}
createTree.prototype.parse = function () {
	this.exp && this.parseTemplate(this.exp); //解析模板
};

createTree.prototype.parseTemplate = function (str, get) {
	/**
	 * 共12种符号：( ) $ { } + > * [ ] . #
	 */
	var thisTree = this;
	function parseLetter(str, tree) {
		var node = {};
		tree = tree || new createNode(thisTree.checkC); //根节点
		tree.parent = tree.parent || new createNode(thisTree.checkC);
		node = tree;
		function matchStart(str) {
			var n = 0;
			var temp = "";
			var strBefore = "";
			function match(str) {
				str.replace(/(((?!\{\{|\}\}+).)*)(\{\{|\}\}+)([\s\S]*)/gm, function () {
					if (arguments[3] == "{{") {
						n++;
						if (n == 1) {
							temp = arguments[4];
							strBefore = arguments[1];
						}
						//node在{{}}内部无用
						match(arguments[4]);
					} else if (/^\}\}/.test(arguments[3])) {
						n--;
						if (n == 0) {
							temp = temp.substring(0, temp.length - arguments[4].length - 2);
							//{{}}匹配完毕，将{{}}的值赋给{{}}前的节点
							matchMiddle(strBefore, temp);
							temp = arguments[4];
						}
						//继续匹配
						match(arguments[4]);
					}
				});
			}
			if (/\{\{|\}\}/.test(str)) {
				match(str);
			} else {
				matchMiddle(str, "");
			}
			temp && matchMiddle(temp, "");
		}
		function matchMiddle(str, exp) {
			//exp为大括号内容
			var n = 0;
			var temp = "";
			var strBefore = "";
			function match(str) {
				str.replace(/(((?![\[\]]).)*)([\[\]])([\s\S]*)/gm, function () {
					if (arguments[3] == "[") {
						n++;
						if (n == 1) {
							temp = arguments[4];
							strBefore = arguments[1];
						}
						match(arguments[4]);
					} else if (arguments[3] == "]") {
						n--;
						if (n == 0) {
							temp = temp.substring(0, temp.length - arguments[4].length - 1);
							matchEnd(strBefore, temp);
							temp = arguments[4];
						}
						match(arguments[4]);
					}
				});
			}
			if (/[\[\]]/.test(str)) {
				match(str);
			} else {
				matchEnd(str, "");
			}
			exp && (node = node.set({type: v1, value: exp}, tree));
			temp && matchEnd(temp, "");
		}
		function matchEnd(str, exp) {
			// exp为中括号内容
			var temp = (str = str.replace(/\s|\t|\n/g, "")); //去除多余空格
			if (/[\.\#\>\+\*]/.test(str)) {
				match(str);
			}
			node = node.set(temp, tree.parent);
			exp && (node = node.set({type: v2, value: exp}, tree.parent));
			function match(str) {
				str.replace(/(((?![\.\#\>\+\*]).)*)([\.\#\>\+\*])([\s\S]*)/, function () {
					node = node.set(arguments[1], tree.parent);
					switch (arguments[3]) {
						case "+":
							node = node.parent.set_child();
							break;
						case ">":
							node = node.set_child();
							break;
						case "#":
							node.set_after("set_id");
							break;
						case ".":
							node.set_after("set_class");
							break;
						case "*":
							node.set_after("set_repeat");
							break;
						default:
							node.set_after("set_ele");
					}
					temp = arguments[4];
					match(arguments[4]);
				});
			}
		}
		matchStart(str);
		return {tree: tree, node: node};
	}
	function parse(str) {
		str = "(" + str + ")";
		var matchV1 = 0;
		var matchV2 = 0;
		function matchStr(str, con, sp) {
			str.replace(/(((?![\(\)]).)*)([\(\)])([\s\S]*)/gm, function () {
				//不匹配{}内的
				arguments[1].replace(/([\{\}\[\]])/gm, function () {
					switch (arguments[1]) {
						case "{":
							matchV1++;
							break;
						case "}":
							matchV1--;
							break;
						case "[":
							matchV2++;
							break;
						case "]":
							matchV2--;
							break;
					}
				});
				if (arguments[3] == "(") {
					if (matchV1 || matchV2) {
						matchStr(arguments[4], con, sp + arguments[1] + "(");
						return;
					}
					var child = {child: [], parent: con, before: sp + arguments[1]};
					con.child.push(child);
					matchStr(arguments[4], child, "");
				} else if (arguments[3] == ")") {
					if (matchV1 || matchV2) {
						matchStr(arguments[4], con, sp + arguments[1] + ")");
						return;
					}
					con.content = sp + arguments[1];
					matchStr(arguments[4], con.parent, "");
					delete con.parent;
				}
			});
			return;
		}
		function parseTree(tree, pTree) {
			//解析树
			var obj = parseLetter(tree.before, pTree);
			var parent = obj.node;
			var child = new createNode(thisTree.checkC);
			child.parent = parent;
			parent.child.push(child);
			tree.child.map(function (ele) {
				obj = parseTree(ele, child);
			});
			obj = parseLetter(tree.content, obj.node);
			return {tree: pTree, node: parent};
		}
		function deepSplice(node) {
			delete node.parent; //切断父节点
			for (var i = 0; i < node.child.length; i++) {
				var el = node.child[i];
				if (el) {
					if (el.ele == "template" && !el.child.length && !el.isTxt) {
						node.child.splice(i, 1);
						i--;
					} else {
						deepSplice(el);
					}
				}
			}
		}
		var tree = {child: [], before: "", content: ""};
		matchStr(str, tree, "");
		var root = new createNode(thisTree.checkC);
		parseTree(tree, root);
		deepSplice(root);
		return root;
	}
	this.tree = parse(str);
};
// 节点
function createNode(checkC) {
	this.ele = "template";
	this.isC = false; //是否是组件
	this.isTxt = false;
	this.data = null; //组件绑定的值
	this.attr = [];
	this.class = [];
	this.id = {type: "string", value: ""};
	this.repeat = [];
	this.child = [];
	this.parent = {};
	this.checkC = checkC;
	this.get = function () {};
	this.after = "set_ele"; //节点最后跟的标志,默认为添加节点名称
}
createNode.prototype.run = function (after, val, tree) {
	tree = tree || this;
	var temp = this.after;
	this.set_after(after);
	this.set(val, tree);
	this.set_after(temp); //恢复
};
createNode.prototype.set = function (val) {
	//root表示根节点
	var set = function (val) {
		if (val && val.type) {
			if (!val.value) {
				return this;
			}
			if (val.type == v1) {
				if (this.after == "set_ele") {
					return this.set_ele(val.value);
					// if (this.isC) {
					// 	return this.set_data({value: val.value, type: "object"});
					// } else {
					// 	if (!this.ele) {
					// 		return this.set_ele(val.value);
					// 	}
					// 	var t = this.set_child();
					// 	t.isTxt = true; //文本节点
					// 	t.data = {value: val.value, type: "object"};
					// 	return this;
					// }
				} else if (this.after == "set_data") {
					if (this.isC) {
						return this.set_data({value: val.value, type: "object"});
					} else {
						var t = this.set_child();
						t.isTxt = true; //文本节点
						t.data = {value: val.value, type: "object"};
						return this;
					}
				} else {
					return this[this.after]({value: val.value, type: "object"});
				}
			}
			if (val.type == v2) {
				return this.set_attr({value: val.value, type: "object"});
			}
		}
		if (val) {
			return this[this.after]({value: val, type: "string"});
		}
		return this;
	}.bind(this);
	return set(val);
};
//设置节点类型
createNode.prototype.set_ele = function (str) {
	this.ele = str.value || str;
	if (this.checkC(str.value)) {
		this.isC = true; //是组件
	}
	this.set_after("set_data");
	return this;
};
//绑定数据
createNode.prototype.set_data = function (data) {
	this.data = data;
	return this;
};
//添加子节点
createNode.prototype.set_child = function () {
	var e = new createNode(this.checkC);
	e.parent = this; //设置父节点
	this.child.push(e);
	this.set_after("set_data");
	return e;
};
//设置节点属性
createNode.prototype.set_attr = function (str) {
	this.attr.push(str);
	this.set_after("set_data");
	return this;
};
//添加class
createNode.prototype.set_class = function (str) {
	this.class.push(str);
	this.set_after("set_data");
	return this;
};
//设置id
createNode.prototype.set_id = function (str) {
	this.id = str;
	this.set_after("set_data");
	return this;
};
//设置重复次数
createNode.prototype.set_repeat = function (str) {
	this.repeat.push(str);
	this.set_after("set_data");
	return this;
};
//设置节点后标志
createNode.prototype.set_after = function (str) {
	this.after = str;
	return this;
};

createNode.prototype.toHTML = function (app) {
	var self = this;
	function getEle(node, i) {
		var doc = document.createDocumentFragment();
		var ele;
		function createEle(node, i) {
			if (node.isTxt) {
				ele = document.createTextNode(getParams(node.data, i));
				doc.appendChild(ele);
			} else {
				var eleName = getParams(node.ele, i);
				if (/^x-/.test(eleName)) {
					if (eleName == "template") {
						ele = document.createDocumentFragment();
					} else {
						var layoutName = eleName.substring(2, eleName.length);
						var data = getParams(node.data, i);
						var fun = app.$refs[layoutName];
						if (!fun) {
							// console.log("···");
							return document.createDocumentFragment();
						}
						var args = fun.args;
						var arr = [];
						var arrStr = [];
						args.map(function (arg, i) {
							arr.push(data[arg]);
							arrStr.push("arr[" + i + "]");
						});
						// console.log("app.$refs[layoutName](" + arrStr.join(",") + ")");
						return eval("app.$refs[layoutName](" + arrStr.join(",") + ")");
					}
				} else {
					ele = document.createElement(eleName);
					node.attr.map(function (e) {
						var obj = getParams(e, i);
						Object.allKeys(obj, function (key, value) {
							ele.setAttribute(key, value);
						});
					});
					node.class.map(function (e) {
						ele.className += " " + getParams(e, i);
					});
				}

				node.child.map(function (e) {
					ele.appendChild(getEle(e, i));
				});
			}
			return ele;
		}
		var n = 1;
		node.repeat.map(function (ele) {
			n = n * getParams(ele, i);
		});
		for (var i = 0; i < n; i++) {
			var dom = createEle(node, i);
			dom && doc.appendChild(dom);
		}
		return doc;
	}
	function getParams(obj, i) {
		var val = (obj.value + "" || "").replace(/\$/, i || 0);
		if (obj.type == "string") {
			return val;
		} else {
			return self.get(val);
		}
	}
	return getEle(this, 0);
};
module.exports = createTree;
