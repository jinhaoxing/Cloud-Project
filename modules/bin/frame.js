var self = this;
module.exports = function (fm, vm) {
	var option = vm.option;
	var list=[];
	Object.X_CLOUD_MAP(option.components, function (key, value) {
		if (typeof value != "string") {
			return;
		}
		list.push(
			self.x.$require(self.x.$path.join(location.href, value)).then(function (ret) {
				option.components[key] = ret;
			})
		);
	});
	Promise.all(list).then(function () {
		return option.run(fm.build(option.data, option.components));
	});
};
