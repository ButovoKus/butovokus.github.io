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

window.onload = function () {
    const gui = new dat.GUI();
    // var splitNumSlider = gui.add(earthData, 'splitNum').min(0).max(1000);
    // var circularSlider = gui.add(earthData, 'circular').min(0.0).max(1.0).step(0.001);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);

    const light = new THREE.HemisphereLight();
    scene.add(light);

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const geometry = new THREE.BufferGeometry();
    reloadBuffer(geometry);

    const texture = new THREE.TextureLoader().load("./resources/textures/bathymetry-grey.png")
        const colorTexture = new THREE.TextureLoader().load("./resources/textures/earth_16k.jpg")
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

    const animate = function () {
        requestAnimationFrame(animate);

        // cube.rotation.x += 0.01;
        // cube.rotation.z += 0.01;

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
