var sceneData = {
    globalTime: 0.0,
	realTime: 0.0,
    covidGeometryCurrent: null,
    covidGeometryNext: null,
    ping: false,
	timeMultiplier: 1.0,
	sumConf: 0,
	sumRecov: 0,
	sumDead:0,
}

function reloadBuffer(geometry) {
    // geometry.dispose()
    loadVertices()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(earthData.posArr, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(earthData.normalsArr, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(earthData.uvArr, 2));
    geometry.setIndex(earthData.indexArr)
}

function vertexShader() {
    return `
	out vec3 outNorm;
	out vec2 outUV;
	out float dh;
	
	uniform sampler2D worldTexture;
	uniform float mountainHeight;
    void main() {
	  outNorm = normal;
	  outUV = uv;
	  
	  float hi = texture(worldTexture, outUV).r;
	  dh = (hi - 0.5) * 2.0 * mountainHeight;
		vec3 pi = position;
		
      vec4 modelViewPosition = modelViewMatrix * vec4(position * (1.0 + dh * 0.1), 1.0);
      gl_Position = projectionMatrix * modelViewPosition; 
    }
  `
}

function fragmentShader() {
    return `
	in vec3 outNorm;
	in vec2 outUV;
	in float dh;
	
	uniform sampler2D colorTexture;
      void main() {
		  vec3 col = texture(colorTexture, outUV).rgb;
		  if (dh < 0.0) {
			col *= (1.0 + dh);
		  }
        gl_FragColor = vec4(col, 1.0);
      }
  `
}

function randInRange(min, max) {
    return Math.random() * (max - min) + min;
}

function checkForUpdateArrays() {
    if (arraysUpdated()) {
        var d0 = covidDataArray[covidDataIndex];
        if (sceneData.ping) {
            updateGeometryAttributes(sceneData.covidGeometryCurrent, d0);
        } else {
            updateGeometryAttributes(sceneData.covidGeometryNext, d0);
        }
    }
}

function updateGeometryAttributes(geometry, newAttributeData) {
    console.log(geometry, newAttributeData);
    geometry.attributes.startPos.set(newAttributeData.posArr);
    geometry.attributes.startTime.set(newAttributeData.timeArr);
    geometry.attributes.caseType.set(newAttributeData.typeArr);
    geometry.attributes.startPos.needsUpdate = true;
    geometry.attributes.startTime.needsUpdate = true;
    geometry.attributes.caseType.needsUpdate = true;
    sceneData.ping = !sceneData.ping;
}

window.onload = function () {

	const container = document.getElementById('container')
	document.body.appendChild(container);
	
	const timeDiv = document.getElementById('timeTd')
	const confSpan = document.getElementById('confSpan')
	const recovSpan = document.getElementById('recovSpan')
	const deadSpan = document.getElementById('deadSpan')

    const gui = new dat.GUI();
    var splitNumSlider = gui.add(earthData, 'splitNum').min(0).max(1000);
    var circularSlider = gui.add(earthData, 'circular').min(0.0).max(1.0).step(0.001);
	var timeMultiplierSlider = gui.add(sceneData, 'timeMultiplier').min(1.0).max(1000.0).step(1.0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(renderer.domElement);

    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(0, 10, 0);
    light.target.position.set(-5, 0, 0);
    scene.add(light);
    scene.add(light.target);

    const geometry = new THREE.BufferGeometry();
    reloadBuffer(geometry);

    const texture = new THREE.TextureLoader().load("./resources/textures/bathymetry-grey.png");
    const colorTexture = new THREE.TextureLoader().load("./resources/textures/earth_16k.jpg");
    // texture.generateMipmaps = false

    var uniforms = {
        worldTexture: {
            type: "t",
            value: texture
        },
        colorTexture: {
            type: "t",
            value: colorTexture
        },
        mountainHeight: {
            type: "f",
            value: earthData.mountainHeight
        },
        worldTime: {
            type: "i",
            value: 0
        },
		realTime: {
            type: "f",
            value: 0.0
        },
		timeMultiplier: {
            type: "f",
            value: 0.0
        }
    }
    var mountainHeightSlider = gui.add(uniforms.mountainHeight, 'value').min(0.0).max(1.0).step(0.001);

    const material = new THREE.ShaderMaterial({
        vertexShader: vertexShader(),
        fragmentShader: fragmentShader(),
        uniforms: uniforms
    });

    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    camera.position.y = -5;
    camera.up = new THREE.Vector3(0.0, 0.0, 1.0);
    camera.lookAt(0.0, 0.0, 0.0);
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.update();

    console.log("CHANGED2");

    var covidMaterial = new THREE.ShaderMaterial({
        vertexShader: covidVertexShader(),
        fragmentShader: covidFragmentShader(),
        uniforms,
        side: THREE.DoubleSide,
        transparent: false
    });
    covidMaterial.blending = THREE.CustomBlending;
    covidMaterial.blendEquation = THREE.AddEquation; //default
    covidMaterial.blendSrc = THREE.SrcAlphaFactor; //default
    covidMaterial.blendDst = THREE.OneMinusSrcAlphaFactor; //default

    var covidMeshCurrent = null;
    var covidMeshNext = null;

    const loader = new THREE.GLTFLoader();
    loader.load('./resources/assets/covid.glb', function (gltf) {
        console.log("LOADED");
        var geom = gltf.scene.children[2].geometry;
        sceneData.covidGeometryCurrent = new THREE.InstancedBufferGeometry().copy(geom);
        sceneData.covidGeometryNext = new THREE.InstancedBufferGeometry().copy(geom);
        sceneData.covidGeometryCurrent.setAttribute("startPos", new THREE.InstancedBufferAttribute(new Float32Array(MAX_DATA_SIZE * 3), 3));
        sceneData.covidGeometryCurrent.setAttribute("startTime", new THREE.InstancedBufferAttribute(new Int32Array(MAX_DATA_SIZE), 1));
        sceneData.covidGeometryCurrent.setAttribute("caseType", new THREE.InstancedBufferAttribute(new Int32Array(MAX_DATA_SIZE), 1));
        sceneData.covidGeometryNext.setAttribute("startPos", new THREE.InstancedBufferAttribute(new Float32Array(MAX_DATA_SIZE * 3), 3));
        sceneData.covidGeometryNext.setAttribute("startTime", new THREE.InstancedBufferAttribute(new Int32Array(MAX_DATA_SIZE), 1));
        sceneData.covidGeometryNext.setAttribute("caseType", new THREE.InstancedBufferAttribute(new Int32Array(MAX_DATA_SIZE), 1));
        covidMeshCurrent = new THREE.InstancedMesh(sceneData.covidGeometryCurrent, covidMaterial, MAX_DATA_SIZE);
        covidMeshNext = new THREE.InstancedMesh(sceneData.covidGeometryNext, covidMaterial, MAX_DATA_SIZE);
        scene.add(covidMeshCurrent);
        scene.add(covidMeshNext);
    }, undefined, function (error) {
        console.log(error)
    });

    var date = new Date(2020, 11, 23);
    loadCovidData(date);

    var stats = new Stats();
    container.appendChild(stats.dom);

    const controlUI = document.createElement("div");

    const animate = function () {
        stats.begin();

        requestAnimationFrame(animate);

        // cube.rotation.x += 0.01;
        // cube.rotation.z += 0.01;

        // if (covidMesh != null) {
        // covidMesh.rotation.z += 0.01;
        // }

        sceneData.globalTime += 1.0/6.0 * sceneData.timeMultiplier;
		sceneData.realTime += 1.0 / 60.0;
        uniforms.worldTime.value = sceneData.globalTime;
		uniforms.realTime.value = sceneData.realTime;
		
		var d1 = new Date(date);
		d1.setDate(date.getDate());
		d1.setSeconds(sceneData.globalTime / 10.0);
		
		timeDiv.innerHTML = d1.toUTCString()
		confSpan.innerHTML = Math.round(1.0 * sceneData.sumConf * sceneData.globalTime / 864000)
		recovSpan.innerHTML = Math.round(1.0 * sceneData.sumRecov * sceneData.globalTime / 864000)
		deadSpan.innerHTML = Math.round(1.0 * sceneData.sumDead * sceneData.globalTime / 864000)

        // if (randInRange(0.0, 1.0) > 0.3) {
        // var lat = randInRange(-90, 90);
        // var lon = randInRange(-180.0, 180.0);
        // var t = globalTime;
        // addCase(lat, lon, t);
        // if (covidMesh != null) {
        // covidMesh.geometry.attributes.startPos.needsUpdate = true;
        // covidMesh.geometry.attributes.startTime.needsUpdate = true;
        // }
        // }

        checkForUpdateArrays();

        renderer.render(scene, camera);

        stats.end();

    };

    animate();

    splitNumSlider.onChange(function (value) {
        reloadBuffer(geometry);
    });

    circularSlider.onChange(function (value) {
        reloadBuffer(geometry);
    });
	
	timeMultiplierSlider.onChange(function (value) {
		uniforms.timeMultiplier.value = value;
	});

}
