const MAX_DATA_SIZE = 10000;
const covidDataArray = new Array();
var covidDataIndex = -1;

var provinceLatLongMap;

var selectedDayData = ({})
var previousDayData = ({})

var selectedDayDataLoaded = false
    var previousDayDataLoaded = false

function getRowObject(fname) {
    var j = 0;
}

function rounded(val) {
    return 1.0 * Math.round(val * 1000) / 1000.0;
}

function arraysUpdated() {
	if (covidDataIndex == -1) {
		var ind = binarySearch();
		if (ind != -1) {
			covidDataIndex = ind;
			return true;
		}
	} else {
		var ai = covidDataArray[covidDataIndex];
		if (ai.endTime < sceneData.globalTime) {
			if (covidDataArray.length - 1 > covidDataIndex) {
				++covidDataIndex;
				return true;
			}
		}
	}
	return false;
}

function latLonToXYZ(lat, lon) {
	lon = lon + 90;
    var zi = Math.sin(lat / 57.3);

    var xi = Math.cos(lon / 57.3) * Math.cos(lat / 57.3);
    var yi = Math.sin(lon / 57.3) * Math.cos(lat / 57.3);
	
	return [xi, yi, zi];
}

function binarySearch() {
	var time = sceneData.globalTime
	if (covidDataArray.length == 0) {
		return -1;
	}
	console.log(covidDataArray[0].endTime, time)
	var l = covidDataArray.length;
	var p0 = 0;
	var p1 = l - 1;
	var t0 = covidDataArray[p0].startTime;
	var t1 = covidDataArray[p1].startTime;
	if (time < t0) {
		return 0;
	}
	if (time > t1) {
		return p1;
	}
	while (p1 - p0 > 1) {
		var p2 = Math.floor(p0 + (p1 - p0) / 2);
		console.log(p0, p2, p1);
		var t2 = covidDataArray[p2].startTime;
		if (t2 > time) {
			p1 = p2;
		} else {
			p0 = p2;
		}
	}
	return p0;
}

function processDay() {
    var mseconds = 86400 * 10;
    var preArr = new Array(mseconds);

    var fillFn = function (num, dType) {
        if (num <= 0) {
            return;
        }
        var step = Math.round(mseconds / num);
        var start = Math.round(randInRange(0.0, step));
		for (var i = 0; i < num; ++i) {
			var k = parseInt(Math.round(randInRange(0, mseconds)));
			if (preArr[k] == undefined) {
                preArr[k] = new Array();
            }
			preArr[k].push(new Object({
                    'lat': lat0 + randInRange(-2, 2),
                    'lon': lon0 + randInRange(-2, 2),
                    't': k,
                    'dataType': dType
                }));
		}
    }

    for (var k of Object.keys(selectedDayData)) {
        if (k in previousDayData) {
            var d1 = selectedDayData[k];
            var d0 = previousDayData[k];
            var lat0 = parseFloat(d0['lat']);
            var lat1 = parseFloat(d1['lat']);
            var lon0 = parseFloat(d0['lon']);
            var lon1 = parseFloat(d1['lon']);
            var conf0 = parseInt(d0['conf']);
            var conf1 = parseInt(d1['conf']);
            var dead0 = parseInt(d0['dead']);
            var dead1 = parseInt(d1['dead']);
            var recov0 = parseInt(d0['recov']);
            var recov1 = parseInt(d1['recov']);
            var dConf = conf1 - conf0;
            var dDead = dead1 - dead0;
            var dRecov = recov1 - recov0;

            fillFn(dConf, 1);
            fillFn(dDead, 3);
            fillFn(dRecov, 2);
			
			sceneData.sumConf += dConf;
			sceneData.sumDead += dDead;
			sceneData.sumRecov += dRecov;
        }
    }

    var k = 0;
    var startTime = 0.0;
    var endTime = 0.0;
    var posArr = new Float32Array(MAX_DATA_SIZE * 3);
    var timeArr = new Uint32Array(MAX_DATA_SIZE);
    var typeArr = new Uint32Array(MAX_DATA_SIZE);
    for (var dat of preArr) {
        if (dat != undefined) {
            for (var singleDat of dat) {
                if (k == 0) {
                    startTime = singleDat.t;
                }
				var xyz = latLonToXYZ(singleDat.lat, singleDat.lon);
				posArr[k * 3] = xyz[0];
				posArr[k * 3 + 1] = xyz[1];
				posArr[k * 3 + 2] = xyz[2];
				timeArr[k] = singleDat.t;
				typeArr[k] = singleDat.dataType;
                ++k;
				endTime = singleDat.t;
                if (k == MAX_DATA_SIZE) {
                    var covidChunk = ({
                        'startTime': startTime,
                        'endTime': endTime,
                        'posArr': posArr,
                        'timeArr': timeArr,
                        'typeArr': typeArr
                    });
                    k = 0;
                    posArr = new Float32Array(MAX_DATA_SIZE * 3);
                    timeArr = new Int32Array(MAX_DATA_SIZE);
                    typeArr = new Int32Array(MAX_DATA_SIZE);
                    covidDataArray.push(covidChunk);
                }
            }
        }
    }
    var covidChunk = ({
        'startTime': startTime,
        'endTime': endTime,
        'posArr': posArr,
        'timeArr': timeArr,
        'typeArr': typeArr
    });
	covidDataArray.push(covidChunk);
}

function globDataForDate(date, dataObj) {
    var day = '' + date.getUTCDate();
    if (day.length == 1) {
        day = '0' + day;
    }

    var mon = '' + date.getUTCMonth();
    if (mon.length == 1) {
        mon = '0' + mon;
    }

    var yr = date.getUTCFullYear();

    var url = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/' + mon + '-' + day + '-' + yr + '.csv';

    console.log("A", date);
    fetch(url)
    .then(function (response) {
        response.text().then(function (text) {
            console.log("C");
            var i = 0;
            var provincePos = 0;
            var latPos = 0;
            var longPos = 0;
            var confPos = 0;
            var deathPos = 0;
            var recovPos = 0;
            for (var l of text.split('\n')) {
                var j = 0;
                var rowData = new Object();
                for (var row of l.split(',')) {
                    if (i == 0) {
                        if (row == 'Lat') {
                            latPos = j;
                        }
                        if (row == 'Long_') {
                            longPos = j;
                        }
                        if (row == 'Province_State' || row == 'Province/State') {
                            provincePos = j;
                        }
                        if (row == 'Confirmed') {
                            confPos = j;
                        }
                        if (row == 'Deaths') {
                            deathPos = j;
                        }
                        if (row == 'Recovered') {
                            recovPos = j;
                        }
                    } else {
                        if (j == provincePos) {
                            rowData['province'] = row;
                        }
                        if (j == latPos) {
                            rowData['lat'] = rounded(parseFloat(row));
                        }
                        if (j == longPos) {
                            rowData['lon'] = rounded(parseFloat(row));
                        }
                        if (j == confPos) {
                            rowData['conf'] = rounded(parseInt(row));
                        }
                        if (j == deathPos) {
                            rowData['dead'] = rounded(parseInt(row));
                        }
                        if (j == recovPos) {
                            rowData['recov'] = rounded(parseInt(row));
                        }
                    }
                    ++j;
                }
                if (rowData.lat != undefined && rowData.lon != undefined) {
					var name = rowData.lat.toString() + rowData.lon.toString();
                    dataObj[name] = rowData;
                }
                ++i;
            }
            if (dataObj == selectedDayData) {
                selectedDayDataLoaded = true
            }
            if (dataObj == previousDayData) {
                previousDayDataLoaded = true
            }
            if (selectedDayDataLoaded && previousDayDataLoaded) {
                processDay()
            }

        });
    });
}

function loadCovidData(date, fillProvinceMap) {
    selectedDayData = new Object();
    previousDayData = new Object();
    globDataForDate(date, selectedDayData);
    var prevDate = new Date(date);
    prevDate.setDate(date.getDate() - 1);
    console.log(prevDate, date);
    globDataForDate(prevDate, previousDayData);
}

function covidVertexShader() {
    return `
	flat out int oDiscard;
	out float damping;
	flat out int oCaseType;
	
	attribute vec3 startPos;
	attribute int startTime;
	attribute int caseType;
	
	uniform int worldTime;
	uniform float realTime;
	uniform float timeMultiplier;
	
    void main() {
		int wt = worldTime;
		oCaseType = caseType;
		int lifeTime = 10000;
		if (wt < startTime || wt > startTime + lifeTime || caseType == 0) {
			oDiscard = 1;
			return;
		}
		float dt = float(wt - startTime);
		damping = (1.0 - dt / float(lifeTime));
		float shift = 0.0;
		if (caseType == 3) {
			shift = dt / float(lifeTime); // 0.0 - 1.0
		}
		oDiscard = 0;
		float scale = 0.001;
		if (caseType == 3) {
			scale = 0.002;
		}
      vec4 modelViewPosition = modelViewMatrix * vec4(position * scale + startPos * (1.0 + shift * 4.0), 1.0);
      gl_Position = projectionMatrix * modelViewPosition; 
    }
  `
}

function covidFragmentShader() {
    return `
	
		flat in int oDiscard;
		flat in int oCaseType;
		in float damping;

      void main() {
		  if (oDiscard == 1) {
			discard;
		  }
		  vec3 col = vec3(0.0, 0.0, 0.0);
		  col[oCaseType - 1] = 1.0;
		  if (oCaseType == 3) {
			col = vec3(1.0);
		  }
        gl_FragColor = vec4(col * damping, damping);
      }
  `
}
