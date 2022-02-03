module.exports = function (fm, vm) {
	var option = vm.option;
	option.run(fm.build(option.data, option.components));
};