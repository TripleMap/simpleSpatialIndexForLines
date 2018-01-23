const Tree = require('./spatialIndex.js');
module.exports = class DataSource {
	constructor() {
		this.dataSourceExtend = {
			minX: 0,
			minY: 0,
			maxX: 10000,
			maxY: 10000
		}
		this.data = [];
		this.generateSomeData();
		let time = new Date().getTime();
		this.generateTree();
		console.log(new Date().getTime() - time);
		console.log('Конец генерации дерева');
	}
	generateSomeData() {
		let time = new Date().getTime();

		for (var i = 0; i < 1000000; i++) {
			this.data[i] = {
				id: i,
				minX: Math.floor(Math.random() * (this.dataSourceExtend.maxX - this.dataSourceExtend.minX + 1) + this.dataSourceExtend.minX),
				minY: Math.floor(Math.random() * (this.dataSourceExtend.maxY - this.dataSourceExtend.minY + 1) + this.dataSourceExtend.minY),
				maxX: Math.floor(Math.random() * (this.dataSourceExtend.maxX - this.dataSourceExtend.minX + 1) + this.dataSourceExtend.minX),
				maxY: Math.floor(Math.random() * (this.dataSourceExtend.maxY - this.dataSourceExtend.minY + 1) + this.dataSourceExtend.minY)
			};
		}
		console.log(new Date().getTime() - time);
		console.log('Конец генерации');
	}

	getFeaturesByBBox(minX, minY, maxX, maxY) {
		let result = [];
		let extent = {
			minX,
			minY,
			maxX,
			maxY
		};
		for (var i = 0, len = this.data.length; i < len; i++) {
			if (this.isExtentcontainsCoords(this.data[i], extent) ||
				this.isLineIntersectsWithExtent(this.data[i], extent)) {
				result.push(this.data[i]);
			}
		}

		return result;
	}

	isExtentcontainsCoords(item, extent) {
		return (item.minX <= extent.maxX && item.minY <= extent.maxY && item.minX >= extent.minX && item.minY >= extent.minY) ||
			(item.maxX <= extent.maxX && item.maxY <= extent.maxY && item.maxX >= extent.minX && item.maxY >= extent.minY);
	}
	isLineIntersectsWithExtent(item, extent) {
		let intersects = false;
		let extentAsLine = [
			[extent.minX, extent.minY],
			[extent.minX, extent.maxY],
			[extent.minX, extent.maxY],
			[extent.maxX, extent.maxY],
			[extent.maxX, extent.maxY],
			[extent.maxX, extent.minY],
			[extent.maxX, extent.minY],
			[extent.minX, extent.minY]
		];

		for (let i = 0; i <= extentAsLine.length - 2; ++i) {
			let ua_t = (item.maxX - item.minX) * (extentAsLine[i][1] - item.minY) - (item.maxY - item.minY) * (extentAsLine[i][0] - item.minX),
				ub_t = (extentAsLine[i + 1][0] - extentAsLine[i][0]) * (extentAsLine[i][1] - item.minY) - (extentAsLine[i + 1][1] - extentAsLine[i][1]) * (extentAsLine[i][0] - item.minX),
				u_b = (item.maxY - item.minY) * (extentAsLine[i + 1][0] - extentAsLine[i][0]) - (item.maxX - item.minX) * (extentAsLine[i + 1][1] - extentAsLine[i][1]);
			if (u_b !== 0) {
				let ua = ua_t / u_b,
					ub = ub_t / u_b;
				if (0 <= ua && ua <= 1 && 0 <= ub && ub <= 1) {
					intersects = true;
				}
			}
		}

		return intersects;
	}

	generateTree() {
		this.tree = new Tree();
		this.tree.loadData(this.data);
	}

	getFeaturesByBBoxTree(minX, minY, maxX, maxY) {
		return this.tree.search({
			minX,
			minY,
			maxX,
			maxY
		});
	}
}