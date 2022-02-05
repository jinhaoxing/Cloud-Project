// this.x.$require("")
module.exports = function (name, txt) {
	return `
    div{{name}}
    +div{{txt.type}}
        >div{{txt.content}}
            >div{{txt.index}}
    `;
};
