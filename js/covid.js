const MAX_DATA_SIZE = 10000;
const covidPosData = new Float32Array(MAX_DATA_SIZE * 3);
const covidTimeData = new Float32Array(MAX_DATA_SIZE * 1);
var covidDataIndex = 0

function loadCovidData(date) {
    var day = '' + date.getUTCDate()
        if (day.length == 1) {
            day = '0' + day
        }

        var mon = '' + date.getUTCMonth()
        if (mon.length == 1) {
            mon = '0' + mon
        }

        var yr = date.getUTCFullYear()

        var url = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/' + mon + '-' + day + '-' + yr + '.csv'
        fetch(url)
        .then(function (response) {
        response.text().then(function (text) {
			console.log(text);
        });
    });

}

function covidVertexShader() {
    return `
	
	flat out int oDiscard;
	
	attribute vec3 startPos;
	attribute float startTime;
	
	uniform float worldTime;
	
    void main() {
		const float lifeTime = 5.0;
		if (worldTime < startTime || worldTime > startTime + lifeTime) {
			oDiscard = 1;
			return;
		}			
		oDiscard = 0;
      vec4 modelViewPosition = modelViewMatrix * vec4(position * 0.01 + startPos, 1.0);
      gl_Position = projectionMatrix * modelViewPosition; 
    }
  `
}

function covidFragmentShader() {
    return `
	
		flat in int oDiscard;

      void main() {
		  if (oDiscard == 1) {
			discard;
		  }
		  vec3 col = vec3(0.0, 1.0, 0.3);
        gl_FragColor = vec4(col, 1.0);
      }
  `
}
