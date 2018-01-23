const express = require('express')
const app = express()
const dataSource = require('./datasource.js')
app.get('/', (req, res) => res.send('Тестирование индексов'));
app.listen(3000, () => {
	app.dataSource = new dataSource();
	console.log('app start!')
});
app.get('/GetFeaturesByBbox', (req, res) => {
	if (req.query) {
		if (req.query.xmin && req.query.ymin && req.query.xmax && req.query.ymax) {
			let timeStart = Date.now();
			res.send(app.dataSource.getFeaturesByBBox(req.query.xmin, req.query.ymin, req.query.xmax, req.query.ymax));
			let timeEnd = Date.now() - timeStart;
			console.log(timeEnd);
		}
	}
})


app.get('/GetFeaturesByBboxTree', (req, res) => {
	if (req.query) {
		if (req.query.xmin && req.query.ymin && req.query.xmax && req.query.ymax) {
			let timeStart = Date.now();
			res.send(app.dataSource.getFeaturesByBBoxTree(req.query.xmin, req.query.ymin, req.query.xmax, req.query.ymax));
			let timeEnd = Date.now() - timeStart;
			console.log(timeEnd);
		}
	}
})