// http://dbs.mathematik.uni-marburg.de/publications/myPapers/1990/BKSS90.pdf
// https://books.google.ru/books?id=YcOlBAAAQBAJ&pg=PA24&lpg=PA24&dq=r*+%D0%B4%D0%B5%D1%80%D0%B5%D0%B2%D0%BE&source=bl&ots=UQR34fPppl&sig=6tdqvidiN6oT9KuAPBv6mmFyemE&hl=ru&sa=X&ved=0ahUKEwjJy93_hN_YAhVDESwKHUuSCTM4ChDoAQhDMAQ#v=onepage&q=r*%20%D0%B4%D0%B5%D1%80%D0%B5%D0%B2%D0%BE&f=false
module.exports = class Rtree {
	constructor(maxEntries) {
		this.maxEntries = maxEntries || 10;
		this.minEntries = Math.max(2, Math.ceil(this.maxEntries * 0.4));
	}
	search() {
		return this.data;
	}

	createTreeFromData(data) {
		if (!(data && data.length)) return this;
		this.node = this.createNode([]);
		for (let i = 0; i < data.length; i++) {
			this.insertItem(data[i]);
		}
		return this;
	}

	chooseSubtree(node) {
		if (node.leaf) {
			return node;
		} else {
			let minArea, minEnlargement;
			minArea = minEnlargement = Infinity;
			for (i = 0, len = node.children.length; i < len; i++) {
				let area = bboxArea(node.children[i]);
				let enlargement = enlargedArea(bbox, node.children[i]) - area;
				if (enlargement < minEnlargement) {
					minEnlargement = enlargement;
					minArea = area < minArea ? area : minArea;
					targetNode = node.children[i];

				} else if (enlargement === minEnlargement) {
					if (area < minArea) {
						minArea = area;
						targetNode = node.children[i];
					}
				}
			}
			return this.chooseSubtree(targetNode || node.children[0]);
		}
	}

	splitNode(node, item) {
		let nodeToInsert;
		this._chooseSplitAxis(node)
		let splitIndex = this._chooseSplitIndex(node);
		let newNode = this.createNode(node.children.splice(splitIndex, node.children.length - splitIndex));
		newNode.leaf = node.leaf;
		this.calculateDistributionBBox(node, 0, node.children.length, item, node);
		this.calculateDistributionBBox(newNode, 0, newNode.children.length, item, newNode);
		if (level) newNode.children.push(newNode);
		else this._splitRoot(node, newNode);
		return nodeToInsert;
	}

	_splitRoot(node, newNode) {
		this.node = createNode([node, newNode]);
		this.node.leaf = false;
		this.calculateDistributionBBox(this.node, 0, this.node.children.length, node, this.node);
	}

	_chooseSplitAxis(node) {
		let M = node.children.length;
		let m = this._minEntries;
		let compareMinX = (a, b) => {
			if (a.minX > b.minX) return 1;
			if (a.minX < b.minX) return -1;
			return 0;
		}

		let compareMinY = (a, b) => {
			if (a.minY > b.minY) return 1;
			if (a.minY < b.minY) return -1;
			return 0;
		}

		let xMargin = this.allDistMargin(node, m, M, compareMinX);
		let yMargin = this.allDistMargin(node, m, M, compareMinY);
		if (xMargin < yMargin) node.children.sort(compareMinX);
	}

	allDistMargin(node, m, M, compare) {
		node.children.sort(compare);
		let leftBBox = this.calculateDistributionBBox(node, 0, m, node);
		let rightBBox = this.calculateDistributionBBox(node, M - m, M, node);
		let margin = this.nodeBboxMargin(leftBBox) + this.nodeBboxMargin(rightBBox);

		for (let i = m; i < M - m; i++) {
			this.extendItemBbox(leftBBox, node.children[i]);
			margin += this.nodeBboxMargin(leftBBox);
		}

		for (let k = M - m - 1; k >= m; k--) {
			this.extendItemBbox(rightBBox, node.children[k]);
			margin += this.nodeBboxMargin(rightBBox);
		}

		return margin;
	}

	_chooseSplitIndex(node) {
		let index;
		let M = node.children.length;
		let m = this._minEntries;
		let minOverlap, minArea;
		minOverlap = minArea = Infinity;

		for (let i = m; i <= M - m; i++) {
			let bbox1 = this.calculateDistributionBBox(node, 0, i, this.toBBox);
			let bbox2 = this.calculateDistributionBBox(node, i, M, this.toBBox);
			let overlap = this.intersectionArea(bbox1, bbox2);
			let area = this.nodeBboxArea(bbox1) + this.nodeBboxArea(bbox2);
			if (overlap < minOverlap) {
				minOverlap = overlap;
				index = i;
				minArea = area < minArea ? area : minArea;
			} else if (overlap === minOverlap) {
				if (area < minArea) {
					minArea = area;
					index = i;
				}
			}
		}

		return index;
	}

	insertItem(item) {
		var node = this.chooseSubtree(this.node);
		if (this.node.children < this.maxEntries) {
			node = this.splitNode(node, item);

		}
		node.children.push(item);
		this.extendItemBbox(node, item);
		this.extendParentBbox(node, item)
	}

	calculateDistributionBBox(node, k, p, toBBox, destNode) {
		if (!destNode) destNode = this.createNode(null);
		destNode.minX = null;
		destNode.minY = null;
		destNode.maxX = null;
		destNode.maxY = null;

		for (var i = k, child; i < p; i++) {
			child = node.children[i];
			this.extendItemBbox(destNode, child);
		}

		return destNode;
	}

	createNode(children, level) {
		return {
			children: children,
			level: level || 1,
			leaf: true,
			minX: null,
			minY: null,
			maxX: null,
			maxY: null

		};
	}

	extendItemBbox(item, extent) {
		item.minX = Math.min(item.minX, extent.minX);
		item.minY = Math.min(item.minY, extent.minY);
		item.maxX = Math.max(item.maxX, extent.maxX);
		item.maxY = Math.max(item.maxY, extent.maxY);
		return item;
	}

	extendParentBbox(node, bbox) {
		for (var i = level; i >= 0; i--) {
			extendItemBbox(path[i], bbox);
		}
	}

	nodeBboxArea(node) {
		return (node.maxX - node.minX) * (node.maxY - node.minY);
	}

	nodeBboxMargin(node) {
		return (node.maxX - node.minX) + (node.maxY - node.minY);
	}

	enlargedArea(item, extent) {
		return (Math.max(item.maxX, extent.maxX) - Math.min(item.minX, extent.minX)) *
			(Math.max(item.maxY, extent.maxY) - Math.min(item.minY, extent.minY));
	}

	intersectionArea(item, extent) {
		var minX = Math.max(item.minX, extent.minX),
			minY = Math.max(item.minY, extent.minY),
			maxX = Math.min(item.maxX, extent.maxX),
			maxY = Math.min(item.maxY, extent.maxY);

		return Math.max(0, maxX - minX) * Math.max(0, maxY - minY);
	}

	isExtentcontainsCoords(item, extent) {
		return item.minX >= extent.minX &&
			item.minY >= extent.minY &&
			item.maxX <= extent.maxX &&
			item.maxY <= extent.maxY;
	}

	intersects(a, b) {
		return b.minX <= a.maxX &&
			b.minY <= a.maxY &&
			b.maxX >= a.minX &&
			b.maxY >= a.minY;
	}
}