var self = this;
self.x
	.$require(
		"./x-tree.js",
		"../utils/function/index.js",
		"../utils/object/index.js",
		"../utils/array/index.js",
		"../utils/class/index.js",
		"./dataProxy.js",
		"./eval.js"
	)
	.then(function (ret) {
		var toProxy, setTempDoc;
		[toProxy, setTempDoc] = ret[5];
		var _eval_ = ret[6];
		module.exports = function (fm, name) {
			var createTree = ret[0];
			function analyse(data, layout) {
				toProxy(data);
				function toHTML(obj, _proxy_) {
					toProxy(_proxy_.get("this") || {});
					function getData(data, $, tempDoc, flag) {
						if (!data) {
							return "";
						}
						if (data.type == "object") {
							//ele的attr发生了变化，表达式为data.value
							if (tempDoc) {
								Object.assign(tempDoc, {
									get: _proxy_.get,
									value: data.value,
									$: $,
									flag: flag,
								});
								setTempDoc(tempDoc);
							}
							var ret = _proxy_.get(data.value, $);
							setTempDoc({}); //清空缓存dom
							return ret;
						}
						return data.value;
					}
					//获取重复次数
					function getRe(list) {
						var arr = [];
						list.map(function (data) {
							if (data.type == "object") {
								arr.push(data.value);
							} else {
								arr.push(parseInt(data.value + ""));
							}
						});
						return arr.join("*");
					}
					function re(obj, parent, reNum, flow) {
						function build(obj, n, flow) {
							var temp = {};
							var temp = {};
							function createEle() {
								//属性
								obj.attr.map(function (v) {
									//属性遍历
									//事件属性:click等需要加$标识
									v = getData(v, n, {
										obj: temp,
										prop: {
											type: "attr",
										},
									});
									Object.X_CLOUD_MAP(v, function (key, value) {
										setTempDoc({
											obj: temp,
											prop: {
												type: "attr",
												key: key,
											},
										});
										if (/^\$.+/.test(key)) {
											key = key.substring(1, key.length);
											temp.element.addEventListener(key, value);
										} else {
											temp.element.setAttribute(key, value);
										}
									});
								});

								//class
								obj.class.map(function (v, i) {
									//属性遍历
									//事件属性：click等需要加$标识
									v = getData(v, n, {
										obj: temp,
										prop: {
											type: "class",
											index: i,
										},
									});

									temp.element.className += (temp.element.className ? " " : "") + v;
								});
								//id
								var tempId = getData(obj.id, n, {
									obj: temp,
									prop: {
										type: "id",
									},
								});
								tempId && (temp.element.id = tempId);
							}

							function mapChild() {
								//子节点
								obj.child.map(function (e) {
									re(e, temp.element, n, flow);
								});
							}
							//构造单个
							if (obj.ele == "template") {
								temp.element = document.createDocumentFragment();
								mapChild();
								return temp.element;
							} else {
								var eleName = obj.ele; //dom名
								if (obj.isC) {
									//组件
									if (obj.data) {
										var v = Object.assign({}, obj.data);
										v.value = "[" + obj.data.value + "]";
										var params = getData(v, n, {
											obj: temp,
											prop: {
												type: "arg",
											},
										});
										var options = new Array(params.length)._X_CLOUD_ARRFILL(function (i) {
											this[i] = "params[" + i + "]";
										});
										temp.element = eval("layoutMap[eleName](" + options.join(",") + ")");
									} else {
										temp.element = eval("layoutMap[eleName]()");
									}
								} else {
									temp.element = document.createElement(eleName);
									//组件不需要再渲染
									createEle();
								}
								mapChild();
								return temp.element;
							}
						}

						function buildRe() {
							//重复多个复制
							var reNum_ = getRe(obj.repeat) || reNum + 1;
							var tempDoc = {
								obj: temp,
								prop: {
									type: "re",
								},
							};
							reNum = getData(
								{
									value: reNum_,
									type: "object",
								},
								1,
								tempDoc
							);

							var tempFrag;

							var fragList = new Array();
							function add(num) {
								var i = 0;
								while (i < num) {
									tempFrag = build(obj, i, {list: fragList, index: i});
									//添加到当前文档流
									if (tempFrag.nodeType == 11) {
										fragList[i] = {
											type: "frag",
											frag: Array._X_CLOUD_ARGTOARR(tempFrag.children),
										};
										fragList[i].frag.map(function (e) {
											parent.appendChild(e);
										});
									} else {
										fragList[i] = {
											type: "ele",
											ele: tempFrag,
										};
										parent.appendChild(tempFrag);
									}
									i++;
								}
							}
							fragList.del = function (num) {
								var i = fragList.length - 1;
								var n = 0;
								if (!i) {
									return;
								}
								while (n < num) {
									//添加到当前文档流
									if (fragList[i].type == "frag") {
										fragList[i].frag.map(function (e) {
											e.parentNode.removeChild(e);
										});
									} else {
										fragList[i].ele.parentNode.removeChild(fragList[i].ele);
									}
									fragList.splice(i, 1);
									i--;
									n++;
								}
							};
							fragList.add = function (num) {
								var i = fragList.length;
								var n = 0;
								var last;

								console.warn(num);
								function push() {
									if (tempFrag.nodeType == 11) {
										fragList[i] = {
											type: "frag",
											frag: Array._X_CLOUD_ARGTOARR(tempFrag.children),
										};
										fragList[i].frag.map(function (e) {
											last.parentNode.insertBefore(e, last.nextSibling);
											last = e;
										});
									} else {
										fragList[i] = {
											type: "ele",
											ele: tempFrag,
										};
										last.parentNode.insertBefore(tempFrag, last.nextSibling);
									}
								}
								if (i == 0 && num) {
									tempFrag = build(obj, i, {list: fragList, index: i});
									var el = flow.list[flow.index];
									if (el.type == "frag") {
										last = el.frag[el.frag.length - 1];
									} else {
										last = el.ele;
									}
									push();
									i++;
									n++;
								}
								while (n < num) {
									last = fragList[i - 1];
									if (last.type == "frag") {
										last = last.frag[last.frag.length - 1];
									} else {
										last = last.ele;
									}
									tempFrag = build(obj, i, {list: fragList, index: i});
									push();
									//添加到当前文档流
									i++;
									n++;
								}
							};
							add(reNum);
							fragList.last = tempFrag;
							tempDoc.fragList = fragList;
						}

						if (obj.isTxt && obj.data) {
							//文本节点
							var temp = {};
							temp.element = document.createTextNode("");
							temp.element.nodeValue = getData(obj.data, reNum, {
								obj: temp,
								prop: {
									type: "txt",
								},
							});
							parent.appendChild(temp.element); //添加文本节点
							return;
						}
						//重复次数
						buildRe();
					}

					var root = document.createDocumentFragment();
					re(obj, root, 0, []);
					return root;
				}

				var layoutMap = {};
				Object.X_CLOUD_MAP(layout, function (key, value) {
					var _proxy_;
					layoutMap[key] = value._X_CLOUD_INJECT({
						run: function (ret) {
							var obj = new createTree(ret, function (str) {
								return layoutMap[str];
							});
							return toHTML(obj.tree, _proxy_);
						},
						proxy: function (p) {
							_proxy_ = p;
						},
						data: data, //绑定this
						eval: _eval_,
					});
				});
				return layoutMap;
			}
			fm[name] = analyse;
		};
	});
