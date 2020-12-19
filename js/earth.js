var earthData = {
	splitNum: 1
	, circular: 0.0
	, posArr: new Float32Array(0)
	, normalsArr: new Float32Array(0)
	, indexArr: []
}

function sumn(n) {
	return n * (n + 1) / 2;
}

function numVertices(numSplit) {
	return 1 + 4 * sumn(numSplit + 1);
	var midVerticesNum = 4 * (numSplit + 1)
	var otherVerticesNum = 2 * (1 + 4 * sumn(numSplit - 1));
	return midVerticesNum + otherVerticesNum;
}

function numColumns(row, numSplit) {
	if (row == 0) {
		return 1;
	}
	return 4 * row;
}

function barycentricToCartesian(b, cx, cy, cz) {
	return (cx.multiplyScalar(b.x))
	.add(cy.multiplyScalar(b.y))
	.add(cz.multiplyScalar(b.z));
}

function vertexBarycentric(row, column, numSplit) {
	var nCols = numColumns(row, numSplit);
	var zb = 1.0 - row / (numSplit + 1);
	var colsPerTriangle = nCols / 4;
	var triangID = Math.floor((column) / colsPerTriangle);
	var triangleCol = column % colsPerTriangle;
	var xb = (1.0 - zb) * (1.0 - triangleCol / (colsPerTriangle));
	var yb = (1.0 - xb - zb);
	var b = new THREE.Vector3(xb, yb, zb);
	
	var cz = new THREE.Vector3(0.0, 0.0, 1.0);
	var cx = new THREE.Vector3(1.0, 0.0, 0.0);
	var cy = new THREE.Vector3(0.0, 1.0, 0.0);
	
	switch (triangID) {
		case 1: {
			cx = new THREE.Vector3(0.0, 1.0, 0.0);
			cy = new THREE.Vector3(-1.0, 0.0, 0.0);
			break;
		}
		case 2: {
			cx = new THREE.Vector3(-1.0, 0.0, 0.0);
			cy = new THREE.Vector3(0.0, -1.0, 0.0);
			break;
		}
		case 3: {
			cx = new THREE.Vector3(0.0, -1.0, 0.0);
			cy = new THREE.Vector3(1.0, 0.0, 0.0);
			break;
		}
	}
	// console.log(xb, yb, zb);
	
	var pos = barycentricToCartesian(b, cx, cy, cz);
	
	// console.log(pos);
	
	return pos;
}

function vertIndex(numSplit, row, column) {
	if (row == 0) {
		return 0;
	}
	var nCols = numColumns(row);
	if (column >= nCols) {
		column = column % nCols;
	}
	
	return 1 + 4 * sumn(row - 1) + column;
}

function loadVertices() {
	var numSplit = Math.floor(earthData.splitNum)
	var nVerts = numVertices(numSplit);
	var nRows = 2 + numSplit;
	earthData.posArr = new Float32Array(nVerts * 3);
	earthData.normalsArr = new Float32Array(nVerts * 3);
	var inds = [];
	var arrPos = 0;
	for (var row = 0; row < nRows; ++row) {
		var nCols = numColumns(row, numSplit);
		for (var col = 0; col < nCols; ++col) {
			var pos = vertexBarycentric(row, col, numSplit);
			var pLength = pos.length();
			pos.setLength(pLength + earthData.circular * (1.0 - pLength));
			pos.toArray(earthData.posArr, arrPos);
			pos.normalize();
			pos.toArray(earthData.normalsArr, arrPos);
			arrPos += 3;
			if (row > 0) {
				var vi = vertIndex(numSplit, row, col);
				
				var upCol = col - Math.floor(col / (nCols / 4));
				var viUp = vertIndex(numSplit, row - 1, upCol);
				var viR = vertIndex(numSplit, row, col + 1);
				var viUpR = vertIndex(numSplit, row - 1, upCol + 1);
				inds.push(vi, viUp, viR, viR, viUp, viUpR);
				// console.log(vi, viUp, viR, viUpR);
			}
		}
	}
	earthData.indexArr = inds;
	
	
	
	
	
// 	var vertexArr = new Float32Array(nVerts * 3);
//	var indexArr = new Uint32Array(nVerts * 3);
}