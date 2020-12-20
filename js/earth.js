var earthData = {
    splitNum: 1,
    circular: 0.0,
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
    return 1 + 4 * sumn(numSplit + 1) + (numSplit + 1);
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
        return 0;
    }
    // if (column >= nCols) {
        // column = column % nCols;
    // }

    return 1 + 4 * sumn(row - 1) + (row - 1) + column;
}

function loadVertices() {
    var numSplit = Math.floor(earthData.splitNum)
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

                // UV
                var uvPos = pos;
                var ang = angleBetween(new THREE.Vector2(0.0, -1.0), new THREE.Vector2(uvPos.x, uvPos.y));
                // console.log(ang);
                ang = ang / (2 * Math.PI);
				if (col == nCols) {
					ang = 1.0;
				}
                var uv = new THREE.Vector2(1.0 - pos.z, ang);
                uv.toArray(earthData.uvArr, uvArrPos);

                // Normal
                pos.normalize();
                pos.toArray(earthData.normalsArr, arrPos);

                arrPos += 3;
                uvArrPos += 2;
                if (row > 0 && col != nCols) {
                    var vi = vertIndex(numSplit, row, col);

                    var upCol = col - Math.floor(col / (nCols / 4));
                    var upDiv = (col + 1) % (nCols / 4);
                    var viUp = vertIndex(numSplit, row - 1, upCol);
                    var viR = vertIndex(numSplit, row, col + 1);
                    var viUpR = vertIndex(numSplit, row - 1, upCol + 1);
                    inds.push(vi, viUp, viR);
                    if (upDiv != 0) {
                        inds.push(viR, viUp, viUpR);
                    }
                }
            }
        }
    }
    earthData.indexArr = inds;

    // 	var vertexArr = new Float32Array(nVerts * 3);
    //	var indexArr = new Uint32Array(nVerts * 3);
}
