module.exports = class SpatialIndex {
	constructor() {
		this.maxEntriesToSplitNodePerLevel = 10;
	}

	loadData(data) {
		if (!(data && data.length)) return this;
		this.data = data;
		this.node = this.createNode();
		this.generateExtent(this.node, this.data);
		for (let i = 0, len = this.data.length; i < len; i++) {
			this.insertItem(i);
		}
		return this;
	}

	extendNodeExtent(node, extent) {
		node.minX = Math.min(node.minX, extent.minX);
		node.minY = Math.min(node.minY, extent.minY);
		node.maxX = Math.max(node.maxX, extent.maxX);
		node.maxY = Math.max(node.maxY, extent.maxY);
	}

	generateExtent(node, data) {
		for (let i = 0, len = this.data.length; i < len; i++) {
			this.extendNodeExtent(node, data[i]);
		}
	}

	createNode(level, extent, children) {
		return {
			children: children || [],
			level: level || 1,
			leaf: true,
			minX: extent ? extent.minX : 0,
			minY: extent ? extent.minY : 0,
			maxX: extent ? extent.maxX : 0,
			maxY: extent ? extent.maxY : 0,
		};
	}

	chooseSubNodes(index, node) {
		let nodes = [];
		if (this.isLineIntersectsWithExtent(this.data[index], node) || this.isExtentcontainsCoords(this.data[index], node)) {
			if (node.leaf) {
				nodes.push(node);
			} else {
				nodes = nodes.concat(this.chooseSubNodes(index, node.children[0]));
				nodes = nodes.concat(this.chooseSubNodes(index, node.children[1]));
				nodes = nodes.concat(this.chooseSubNodes(index, node.children[2]));
				nodes = nodes.concat(this.chooseSubNodes(index, node.children[3]));
			}
		}
		return nodes;
	}

	insertItem(index, node) {
		let nodes = this.chooseSubNodes(index, this.node);
		for (let i = nodes.length - 1; i >= 0; i--) {
			if (nodes[i].children.length <= Math.pow(this.maxEntriesToSplitNodePerLevel, nodes[i].level)) {
				nodes[i].children.push(index);
			} else {
				this.splitNode(nodes[i]);
				let subNodes = this.chooseSubNodes(index, nodes[i]);
				for (let s = subNodes.length - 1; s >= 0; s--) {
					subNodes[s].children.push(index);
				}
			}
		}
	}

	splitNode(node) {
		let splitAxisXCoord = (node.maxX - node.minX) / 2;
		let splitAxisYCoord = (node.maxY - node.minY) / 2;

		let nodesAsChildren = [
			this.createNode(node.level + 1, {
				minX: node.minX,
				minY: splitAxisYCoord,
				maxX: splitAxisXCoord,
				maxY: node.maxY
			}),
			this.createNode(node.level + 1, {
				minX: splitAxisXCoord,
				minY: splitAxisYCoord,
				maxX: node.maxX,
				maxY: node.maxY
			}),
			this.createNode(node.level + 1, {
				minX: node.minX,
				minY: node.minY,
				maxX: splitAxisXCoord,
				maxY: splitAxisYCoord
			}),
			this.createNode(node.level + 1, {
				minX: splitAxisXCoord,
				minY: node.minY,
				maxX: node.maxX,
				maxY: splitAxisYCoord
			})
		]
		for (let i = 0, len = node.children.length; i < len; i++) {
			if (this.isExtentcontainsCoords(this.data[node.children[i]], nodesAsChildren[0])) {
				nodesAsChildren[0].children.push(node.children[i]);
			} else if (this.isLineIntersectsWithExtent(this.data[node.children[i]], nodesAsChildren[0])) {
				nodesAsChildren[0].children.push(node.children[i]);
			}
			if (this.isExtentcontainsCoords(this.data[node.children[i]], nodesAsChildren[1])) {
				nodesAsChildren[1].children.push(node.children[i]);
			} else if (this.isLineIntersectsWithExtent(this.data[node.children[i]], nodesAsChildren[1])) {
				nodesAsChildren[1].children.push(node.children[i]);
			}
			if (this.isExtentcontainsCoords(this.data[node.children[i]], nodesAsChildren[2])) {
				nodesAsChildren[2].children.push(node.children[i]);
			} else if (this.isLineIntersectsWithExtent(this.data[node.children[i]], nodesAsChildren[2])) {
				nodesAsChildren[2].children.push(node.children[i]);
			}
			if (this.isExtentcontainsCoords(this.data[node.children[i]], nodesAsChildren[3])) {
				nodesAsChildren[3].children.push(node.children[i]);
			} else if (this.isLineIntersectsWithExtent(this.data[node.children[i]], nodesAsChildren[3])) {
				nodesAsChildren[3].children.push(node.children[i]);
			}
		}

		node.leaf = false;
		node.children = nodesAsChildren;

		return node;
	}

	isExtentcontainsCoords(item, extent) {
		return item.minX >= extent.minX &&
			item.minY >= extent.minY &&
			item.maxX <= extent.maxX &&
			item.maxY <= extent.maxY;
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
		let ua_t, ub_t, u_b, ua, ub;
		for (let i = 0; i <= extentAsLine.length - 2; ++i) {
			ua_t = (item.maxX - item.minX) * (extentAsLine[i][1] - item.minY) - (item.maxY - item.minY) * (extentAsLine[i][0] - item.minX);
			ub_t = (extentAsLine[i + 1][0] - extentAsLine[i][0]) * (extentAsLine[i][1] - item.minY) - (extentAsLine[i + 1][1] - extentAsLine[i][1]) * (extentAsLine[i][0] - item.minX);
			u_b = (item.maxY - item.minY) * (extentAsLine[i + 1][0] - extentAsLine[i][0]) - (item.maxX - item.minX) * (extentAsLine[i + 1][1] - extentAsLine[i][1]);
			if (u_b !== 0) {
				ua = ua_t / u_b;
				ub = ub_t / u_b;
				if (0 <= ua && ua <= 1 && 0 <= ub && ub <= 1) {
					intersects = true;
				}
			}
		}

		return intersects;
	}

	isIntersectNodeAndBBox(n, b) {
		return b.minX <= n.maxX &&
			b.minY <= n.maxY &&
			b.maxX >= n.minX &&
			b.maxY >= n.minY;
	}

	search(bbox) {
		let inspectNode;
		let nodes = [];
		let result = [];
		nodes.push(this.node);

		while (inspectNode = nodes.pop()) {
			if (inspectNode.leaf) {
				for (let index = 0, len = inspectNode.children.length; index < len; index++) {

					if (result.indexOf(this.data[inspectNode.children[index]]) === -1 &&
						(this.isExtentcontainsCoords(this.data[inspectNode.children[index]], bbox) || this.isLineIntersectsWithExtent(this.data[inspectNode.children[index]], bbox))) {
						result.push(this.data[inspectNode.children[index]]);
					}
				}
			} else {
				for (let i = 0; i < inspectNode.children.length; i++) {
					if (this.isIntersectNodeAndBBox(inspectNode.children[i], bbox)) {
						nodes.push(inspectNode.children[i]);
					}
				}
			}
		}
		return result;
	}
}