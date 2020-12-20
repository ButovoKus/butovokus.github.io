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
    void main() {
	  outNorm = normal;
	  outUV = uv;

      vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * modelViewPosition; 
    }
  `
}

function fragmentShader() {
return `
	in vec3 outNorm;
	in vec2 outUV;
	
	uniform sampler2D worldTexture; 
      void main() {
        gl_FragColor = texture(worldTexture, outUV);
      }
  `
}

window.onload = function () {
    const gui = new dat.GUI();
    var splitNumSlider = gui.add(earthData, 'splitNum').min(0).max(100);
    var circularSlider = gui.add(earthData, 'circular').min(0.0).max(1.0).step(0.001);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    const light = new THREE.HemisphereLight();
    scene.add(light);

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const geometry = new THREE.BufferGeometry();
    reloadBuffer(geometry);

	const texture = new THREE.TextureLoader().load("./resources/textures/earth-4k.jpg")
	texture.generateMipmaps = false
	
	var uniforms =  {
		worldTexture: {
			type: "t"
			, value: texture
		}
	}
	
    const material = new THREE.ShaderMaterial({
		vertexShader: vertexShader()
		, fragmentShader: fragmentShader()
		, uniforms: uniforms
	});
	
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    camera.position.y = -5;
    camera.up = new THREE.Vector3(0.0, 0.0, 1.0);
    camera.lookAt(0.0, 0.0, 0.0);

    const animate = function () {
        requestAnimationFrame(animate);

        //				cube.rotation.x += 0.01;
        cube.rotation.z += 0.01;

        renderer.render(scene, camera);
    };

    animate();

    splitNumSlider.onChange(function (value) {
        reloadBuffer(geometry);
    });

    circularSlider.onChange(function (value) {
        reloadBuffer(geometry);
    });
}
