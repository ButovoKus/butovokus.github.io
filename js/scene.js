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

function addCase(lat, lon, time) {
    lon = lon + 90;
    var zi = Math.sin(lat / 57.3);

    var xi = Math.cos(lon / 57.3) * Math.cos(lat / 57.3);
    var yi = Math.sin(lon / 57.3) * Math.cos(lat / 57.3);

    var p0 = 3 * covidDataIndex;
    covidPosData[p0] = xi;
    covidPosData[p0 + 1] = yi;
    covidPosData[p0 + 2] = zi;

    covidTimeData[covidDataIndex] = time;

    ++covidDataIndex;
    if (covidDataIndex >= MAX_DATA_SIZE) {
        covidDataIndex = 0
    }
}

function randInRange(min, max) {
    return Math.random() * (max - min) + min;
}

window.onload = function () {
    var globalTime = 0.0;

    const gui = new dat.GUI();
    // var splitNumSlider = gui.add(earthData, 'splitNum').min(0).max(1000);
    // var circularSlider = gui.add(earthData, 'circular').min(0.0).max(1.0).step(0.001);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

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

    var covidMesh = null;

    const loader = new THREE.GLTFLoader();
    loader.load('./resources/assets/covid.glb', function (gltf) {
        console.log("LOADED");
        var geom = gltf.scene.children[2].geometry;
        var covidGeom = new THREE.InstancedBufferGeometry().copy(geom);
        covidGeom.setAttribute("startPos", new THREE.InstancedBufferAttribute(covidPosData, 3));
        covidGeom.setAttribute("startTime", new THREE.InstancedBufferAttribute(covidTimeData, 1));
        var mat = new THREE.ShaderMaterial({
            vertexShader: covidVertexShader(),
            fragmentShader: covidFragmentShader(),
            uniforms,
            side: THREE.DoubleSide,
            transparent: false
        });
        covidMesh = new THREE.InstancedMesh(covidGeom, mat, MAX_DATA_SIZE);
        scene.add(covidMesh);
    }, undefined, function (error) {
        console.log(error)
    });

    var date = new Date(2020, 8, 10);
    loadCovidData(date);

    const animate = function () {
        requestAnimationFrame(animate);

        // cube.rotation.x += 0.01;
        // cube.rotation.z += 0.01;

        // if (covidMesh != null) {
        // covidMesh.rotation.z += 0.01;
        // }

        globalTime += 1.0 / 60.0;
        uniforms.worldTime.value = globalTime;

        if (randInRange(0.0, 1.0) > 0.3) {
            var lat = randInRange(-90, 90);
            var lon = randInRange(-180.0, 180.0);
            var t = globalTime;
            addCase(lat, lon, t);
            if (covidMesh != null) {
                covidMesh.geometry.attributes.startPos.needsUpdate = true;
                covidMesh.geometry.attributes.startTime.needsUpdate = true;
            }
        }

        renderer.render(scene, camera);

    };

    animate();

    // splitNumSlider.onChange(function (value) {
    // reloadBuffer(geometry);
    // });

    // circularSlider.onChange(function (value) {
    // reloadBuffer(geometry);
    // });

}
