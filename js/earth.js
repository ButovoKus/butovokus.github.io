var earthData = {
    splitNum: 500,
    circular: 1.0,
	mountainHeight: 0.0,
    posArr: new Float32Array(0),
    normalsArr: new Float32Array(0),
    uvArr: new Float32Array(0),
    indexArr: []
}

function sumn(n) {
    return n * (n + 1) / 2;
}

function angleBetween(v1, v2) {
    var vi = Math.atan2(v2.y, v2.x) - Math.atan2(v1.y, v1.x);
    if (vi < 0) {
        vi += 2 * Math.PI;
    }
    return vi;
}

function numVertices(numSplit) {
    return (5 + 4 * sumn(numSplit + 1) + (numSplit + 1)) * 2 - numColumns(numSplit + 1) - 1;
}

function numColumns(row, numSplit) {
    if (row == 0) {
        return 5;
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
    var cx = new THREE.Vector3(0.0, -1.0, 0.0);
    var cy = new THREE.Vector3(1.0, 0.0, 0.0);

    switch (triangID) {
    case 1: {
            cx = new THREE.Vector3(1.0, 0.0, 0.0);
            cy = new THREE.Vector3(0.0, 1.0, 0.0);
            break;
        }
    case 2: {
            cx = new THREE.Vector3(0.0, 1.0, 0.0);
            cy = new THREE.Vector3(-1.0, 0.0, 0.0);
            break;
        }
    case 3: {
            cx = new THREE.Vector3(-1.0, 0.0, 0.0);
            cy = new THREE.Vector3(0.0, -1.0, 0.0);
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
        return column;
    }
    // if (column >= nCols) {
    // column = column % nCols;
    // }

    return 5 + 4 * sumn(row - 1) + (row - 1) + column;
}

function loadVertices() {
    var numSplit = Math.floor(earthData.splitNum);
    var nVerts = numVertices(numSplit);
    var nRows = 2 + numSplit;
    earthData.posArr = new Float32Array(nVerts * 3);
    earthData.normalsArr = new Float32Array(nVerts * 3);
    earthData.uvArr = new Float32Array(nVerts * 2);
    var inds = [];
    var arrPos = 0;
    var uvArrPos = 0;

    for (var row = 0; row < nRows; ++row) {
        var nCols = numColumns(row, numSplit);
        for (var col = 0; col <= nCols; ++col) {
            if (!(row == 0 && col == nCols)) {
                // Position
                var pos = vertexBarycentric(row, col, numSplit);
                var pLength = pos.length();
                pos.setLength(pLength + earthData.circular * (1.0 - pLength));
                pos.toArray(earthData.posArr, arrPos);
				var posN = new THREE.Vector3(pos.x, pos.y, pos.z);
				posN.normalize();

                var posDn = new THREE.Vector3(pos.x, pos.y, -pos.z);

                // UV
                var uvPos = pos;
                var ang = angleBetween(new THREE.Vector2(0.0, -1.0), new THREE.Vector2(uvPos.x, uvPos.y));
				if (row == 0) {
					ang = 2 * Math.PI * col / 4.0;
				}
                ang = ang / (2 * Math.PI);
                if (col == nCols) {
                    ang = 1.0;
                }
                var uv = new THREE.Vector2(ang, (Math.PI / 2.0 + Math.asin(posN.z)) / Math.PI);
                uv.toArray(earthData.uvArr, uvArrPos);
                var uvDn = new THREE.Vector2(uv.x, 1.0 - uv.y);

                // Normal
                pos.normalize();
                pos.toArray(earthData.normalsArr, arrPos);
                normDn = pos;
                normDn.z = pos.z - 1.0;
                // normDn.toArray(earthData.normalsArr, nVerts * 3 - arrPos);

                if (row != nRows - 1) {
                    posDn.toArray(earthData.posArr, nVerts * 3 - arrPos - 3);
                    uvDn.toArray(earthData.uvArr, nVerts * 2 - uvArrPos - 2);
                    // normDn.toArray(earthData.posArr, nVerts * 3 - arrPos - 3);
                }
                // console.log(earthData.posArr)

                arrPos += 3;
                uvArrPos += 2;
                if (row > 0) {
                    var vi = vertIndex(numSplit, row, col);

                    var upCol = col - Math.floor(col / (nCols / 4));
					if (row == 1) {
						upCol = col;
					}
                    var viUp = vertIndex(numSplit, row - 1, upCol);
                    var viR = vertIndex(numSplit, row, col + 1);
                    var viUpR = vertIndex(numSplit, row - 1, upCol + 1);
					
					if (col == nCols) {
						viR = vertIndex(numSplit, row, 0);
						viUpR = vertIndex(numSplit, row - 1, 0);
					}
					
                    inds.push(viR, viUp, vi);

                    var dnVi = nVerts - vi - 1;
                    var dnViUp = nVerts - viUp - 1;
                    var dnViR = nVerts - viR - 1;
                    var dnViUpR = nVerts - viUpR - 1;
					if (row == nRows - 1) {
						dnVi = vi;
						dnViR = viR;
					}
					
                    inds.push(dnVi, dnViUp, dnViR);
					
                    var upDiv = (col + 1) % (nCols / 4);
                    if (upDiv != 0) {
                        inds.push(viUpR, viUp, viR);
                        inds.push(dnViR, dnViUp, dnViUpR);
                    }
                }
            }
        }
    }
    earthData.indexArr = inds;

    // 	var vertexArr = new Float32Array(nVerts * 3);
    //	var indexArr = new Uint32Array(nVerts * 3);
}
