var settings = {
	MAX_X_rotate_view: 60,
	MAX_Y_rotate_view: 60,
	MAX_Z_rotate_view: 60,
	MAX_head_count: 20,
	MAX_MOVE_SPEED: 500,
	FOG_COLOR: [0.8, 0.9, 1, 1],
	FOG_NEAR: 0.9985,
	FOG_FAR: 1.0,
	BULLET_SIZE: 2,
	BULLET_SPEED: 1000,
};

var hp = 100;
var score = 0;
var position = [0, 0, 0];
var angle = [0, 0, 0];
var speed = 0;
var rotate_view = [0, 0, 0];
var then = 0;
var keysPressed = {};
var head_model_position = undefined;
var bullet_model_position = undefined;
var heads = [];
var flying_bullets = [];
var gun_cool = 1;

var shot_sound = new Audio("./gunshot.wav");
var send_to_jesus_sound = new Audio("./send_to_jesus.mp3");

function radToDeg(r) {
	return (r * 180) / Math.PI;
}

function degToRad(d) {
	return (d * Math.PI) / 180;
}

function distence2(pt, pt2 = null) {
	if (!pt2) {
		pt2 = position;
	}
	return (
		Math.pow(pt2[0] - pt[0], 2) +
		Math.pow(pt2[1] - pt[1], 2) +
		Math.pow(pt2[2] - pt[2], 2)
	);
}

("use strict");

var vertexShaderSource = `#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec4 a_position;
in vec4 a_color;

// A matrix to transform the positions by
uniform mat4 u_matrix;

// a varying the color to the fragment shader
out vec4 v_color;

// all shaders have a main function
void main() {
// Multiply the position by the matrix.
gl_Position = u_matrix * a_position;

// Pass the color to the fragment shader.
v_color = a_color;
}
`;

var fragmentShaderSource = `#version 300 es

precision highp float;
uniform vec4 u_fogColor;
uniform float u_fogNear;
uniform float u_fogFar;

// the varied color passed from the vertex shader
in vec4 v_color;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
float fogAmount = smoothstep(u_fogNear, u_fogFar, gl_FragCoord.z);
outColor = mix(v_color, u_fogColor, fogAmount);
}
`;

function main() {
	// Get A WebGL context
	/** @type {HTMLCanvasElement} */
	var canvas = document.querySelector("#canvas");
	var score_canvas = document.querySelector("#score");
	var gl = canvas.getContext("webgl2");
	var ctx = score_canvas.getContext("2d");
	score_canvas.width = score_canvas.clientWidth;
	score_canvas.height = score_canvas.clientHeight;
	ctx.font = "40px serif";
	if (!gl) {
		return;
	}

	// Use our boilerplate utils to compile the shaders and link into a program
	var program = webglUtils.createProgramFromSources(gl, [
		vertexShaderSource,
		fragmentShaderSource,
	]);

	// look up where the vertex data needs to go.
	var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
	var colorAttributeLocation = gl.getAttribLocation(program, "a_color");

	// look up uniform locations
	var matrixLocation = gl.getUniformLocation(program, "u_matrix");
	var fogColorLocation = gl.getUniformLocation(program, "u_fogColor");
	var fogNearLocation = gl.getUniformLocation(program, "u_fogNear");
	var fogFarLocation = gl.getUniformLocation(program, "u_fogFar");

	// Create a buffer
	var positionBuffer = gl.createBuffer();

	// Create a vertex array object (attribute state)
	var vao = gl.createVertexArray();

	// and make it the one we're currently working with
	gl.bindVertexArray(vao);

	// Turn on the attribute
	gl.enableVertexAttribArray(positionAttributeLocation);

	// Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	// Set Geometry.
	var numVertices = setGeometry(gl);

	// Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
	var size = 3; // 3 components per iteration
	var type = gl.FLOAT; // the data is 32bit floats
	var normalize = false; // don't normalize the data
	var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
	var offset = 0; // start at the beginning of the buffer
	gl.vertexAttribPointer(
		positionAttributeLocation,
		size,
		type,
		normalize,
		stride,
		offset
	);

	// create the color buffer, make it the current ARRAY_BUFFER
	// and copy in the color values
	var colorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	setColors(gl);

	// Turn on the attribute
	gl.enableVertexAttribArray(colorAttributeLocation);

	// Tell the attribute how to get data out of colorBuffer (ARRAY_BUFFER)
	var size = 3; // 3 components per iteration
	var type = gl.UNSIGNED_BYTE; // the data is 8bit unsigned bytes
	var normalize = true; // convert from 0-255 to 0.0-1.0
	var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next color
	var offset = 0; // start at the beginning of the buffer
	gl.vertexAttribPointer(
		colorAttributeLocation,
		size,
		type,
		normalize,
		stride,
		offset
	);

	var fieldOfViewRadians = degToRad(60);

	for (var i = 0; i < settings.MAX_head_count; ++i) {
		heads.push(generate_new_head());
	}

	requestAnimationFrame(drawScene);

	// Draw the scene.
	function drawScene(now) {
		now *= 0.001;
		var deltaTime = now - then;
		then = now;
		gun_cool += deltaTime;
		{
			if (keysPressed["w"] || keysPressed["s"]) {
				var s = keysPressed["w"] ? 1 : 0;
				if (speed != s * settings.MAX_MOVE_SPEED) {
					speed += (s * settings.MAX_MOVE_SPEED - speed) / 20;
				}
			} else {
				speed -= speed / 50;
			}
			if (keysPressed["ArrowUp"] || keysPressed["ArrowDown"]) {
				var s = keysPressed["ArrowUp"] ? 1 : -1;
				if (angle[0] != -s * settings.MAX_X_rotate_view) {
					angle[0] +=
						(-s * settings.MAX_X_rotate_view - angle[0]) / 20;
				}
			} else {
				angle[0] -= angle[0] / 20;
			}
			if (keysPressed["a"] || keysPressed["d"]) {
				var s = keysPressed["d"] ? 1 : -1;
				if (angle[1] != -s * settings.MAX_Y_rotate_view) {
					angle[1] +=
						(-s * settings.MAX_Y_rotate_view - angle[1]) / 20;
				}
			} else {
				angle[1] -= angle[1] / 20;
			}
			if (keysPressed["ArrowLeft"] || keysPressed["ArrowRight"]) {
				var s = keysPressed["ArrowRight"] ? 1 : -1;
				if (angle[2] != -s * settings.MAX_Z_rotate_view) {
					angle[2] +=
						(-s * settings.MAX_Z_rotate_view - angle[2]) / 20;
				}
			} else {
				angle[2] -= angle[2] / 50;
			}
			var rotate_matrix = m4.translation(0, 0, 0);
			rotate_matrix = m4.xRotate(rotate_matrix, degToRad(angle[0]));
			rotate_matrix = m4.yRotate(rotate_matrix, degToRad(angle[1]));
			rotate_matrix = m4.zRotate(rotate_matrix, degToRad(360 - angle[2]));
			var new_pos = [0, 0, 0, 0, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0, 0, 0];
			new_pos = m4.multiply(new_pos, rotate_matrix);
			var s = speed * deltaTime;
			position[0] -= s * new_pos[0];
			position[1] -= s * new_pos[4];
			position[2] += s * new_pos[8];
			for (var i = 0; i < flying_bullets.length; ++i) {
				if (
					!flying_bullets[i].enabled ||
					distence2(flying_bullets[i].position) > 1000000
				) {
					flying_bullets[i].enabled = false;
					continue;
				}
				var s = settings.BULLET_SPEED * deltaTime;
				flying_bullets[i].position[0] -=
					s * flying_bullets[i].vector[0];
				flying_bullets[i].position[1] -=
					s * flying_bullets[i].vector[1];
				flying_bullets[i].position[2] +=
					s * flying_bullets[i].vector[2];
			}
			//shot
			if (keysPressed[" "] && gun_cool >= 0.5) {
				var bullet = {
					position: position.slice(),
					vector: [new_pos[0], new_pos[4], new_pos[8]],
					enabled: true,
				};
				flying_bullets.push(bullet);
				shot_sound.currentTime = 0;
				shot_sound.play();
				gun_cool = 0;
			}
		}
		webglUtils.resizeCanvasToDisplaySize(gl.canvas);

		// Tell WebGL how to convert from clip space to pixels
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

		// Clear the canvas AND the depth buffer.
		gl.clearColor(...settings.FOG_COLOR);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		// turn on depth testing
		gl.enable(gl.DEPTH_TEST);

		// tell webgl to cull faces
		gl.enable(gl.CULL_FACE);

		// Tell it to use our program (pair of shaders)
		gl.useProgram(program);

		// Bind the attribute/buffer set we want.
		gl.bindVertexArray(vao);

		// set the fog color and near, far settings
		gl.uniform4fv(fogColorLocation, settings.FOG_COLOR);
		gl.uniform1f(fogNearLocation, settings.FOG_NEAR);
		gl.uniform1f(fogFarLocation, settings.FOG_FAR);

		// Compute the matrix
		var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
		var zNear = 1;
		var zFar = 3000;
		var projectionMatrix = m4.perspective(
			fieldOfViewRadians,
			aspect,
			zNear,
			zFar
		);

		var up = [0, 1, 0];
		//console.log(rotate);
		var viewMatrix = m4.translation(0, 0, 0);
		viewMatrix = m4.translate(
			viewMatrix,
			position[0],
			position[1] + 50,
			position[2] + 300
		);
		viewMatrix = m4.inverse(viewMatrix);
		viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

		// Draw heads in a grid

		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		// Set Geometry.
		var min = 99999999;
		var min_i = 0;
		for (var i = 0; i < settings.MAX_head_count; ++i) {
			var dis = distence2(heads[i]);
			for (var j = 0; j < flying_bullets.length; ++j) {
				if (!flying_bullets[j].enabled) continue;
				var my_matrix = m4.translation(
					flying_bullets[j].position[0],
					flying_bullets[j].position[1],
					flying_bullets[j].position[2]
				);
				drawBullet(my_matrix, viewProjectionMatrix, matrixLocation);
				var dis2 = distence2(heads[i], flying_bullets[j].position);
				if (dis2 < 3000) {
					heads[i] = generate_new_head();
					dis = distence2(heads[i]);
					flying_bullets[j].enabled = false;
					score++;
				}
			}
			if (heads[i][2] > position[2] && dis > 250000) {
				heads[i] = generate_new_head();
				dis = distence2(heads[i]);
			} else if (dis < 3000) {
				var a =
					Math.pow(heads[i][0] - position[0], 2) +
					Math.pow(heads[i][1] - position[1], 2);
				hp -= (10 * (3000 - a)) / 3000;

				if (hp <= 0) {
					send_to_jesus_sound.play();
					alert("你墜毀了");
					location.reload();
				}
				heads[i] = generate_new_head();
				dis = distence2(heads[i]);
				var oof_sound = new Audio("./oof.mp3");
				oof_sound.play();
			}
			if (dis < min) {
				min = dis;
				min_i = i;
			}
			var matrix = m4.lookAt(heads[i], position, up);
			drawHead(matrix, viewProjectionMatrix, matrixLocation, numVertices);
		}
		var min_matrix = m4.lookAt(
			[position[0], position[1] + 50, position[2]],
			heads[min_i],
			up
		);
		drawArrow(
			min_matrix,
			viewProjectionMatrix,
			matrixLocation,
			numVertices
		);
		var my_matrix = m4.translation(position[0], position[1], position[2]);
		my_matrix = m4.yRotate(my_matrix, degToRad(angle[1]));
		my_matrix = m4.zRotate(my_matrix, degToRad(angle[2]));
		my_matrix = m4.xRotate(my_matrix, degToRad(angle[0]));
		drawPlane(my_matrix, viewProjectionMatrix, matrixLocation);

		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		ctx.fillText("機體完整度: " + Math.ceil(hp), 5, 40);
		ctx.fillText("空速: " + Math.round(speed), 5, 80);
		ctx.fillText("擊中目標數: " + score, 5, 120);

		requestAnimationFrame(drawScene);
	}

	function generate_new_head() {
		var x = Math.random() * 700 - 350 + position[0];
		var y = Math.random() * 700 - 350 + position[1];
		var z = Math.random() * -500 - 500 + position[2];
		x += x > 0 ? 30 : -30;
		y += y > 0 ? 30 : -30;
		return [x, y, z];
	}

	function drawHead(
		matrix,
		viewProjectionMatrix,
		matrixLocation,
		numVertices
	) {
		// multiply that with the viewProjecitonMatrix
		matrix = m4.multiply(viewProjectionMatrix, matrix);

		// Set the matrix.
		gl.uniformMatrix4fv(matrixLocation, false, matrix);

		gl.bufferData(gl.ARRAY_BUFFER, head_model_position, gl.STATIC_DRAW);
		// Draw the geometry.
		var primitiveType = gl.TRIANGLES;
		var offset = 0;
		gl.drawArrays(primitiveType, offset, numVertices);
	}

	function drawPlane(matrix, viewProjectionMatrix, matrixLocation) {
		// multiply that with the viewProjecitonMatrix
		matrix = m4.multiply(viewProjectionMatrix, matrix);
		var positions = new Float32Array([
			//left wing
			-5, 0, -50, -50, 2.5, 0, -5, 2.5, 0, -5, 2.5, 0, -50, 2.5, 0, -5,
			-2.5, 0, -5, -2.5, 0, -50, 2.5, 0, -50, -2.5, 0, -5, -2.5, 0, -50,
			-2.5, 0, -5, 0, -50, -5, 0, -50, -50, -2.5, 0, -50, 2.5, 0,
			//right wing
			5, 0, -50, 5, 2.5, 0, 50, 2.5, 0, 5, 2.5, 0, 5, -2.5, 0, 50, 2.5, 0,
			5, -2.5, 0, 50, -2.5, 0, 50, 2.5, 0, 5, -2.5, 0, 5, 0, -50, 50,
			-2.5, 0, 5, 0, -50, 50, 2.5, 0, 50, -2.5, 0,
			//body
			-5, -5, -55, -5, 5, -55, 5, 5, -55, 5, 5, -55, 5, -5, -55, -5, -5,
			-55, -5, 5, -55, -5, 5, 55, 5, 5, 55, 5, 5, 55, 5, 5, -55, -5, 5,
			-55, -5, -5, -55, 5, -5, -55, 5, -5, 55, 5, -5, 55, -5, -5, 55, -5,
			-5, -55, -5, -5, 55, 5, -5, 55, 5, 5, 55, 5, 5, 55, -5, 5, 55, -5,
			-5, 55, -5, -5, -55, -5, -5, 55, -5, 5, 55, -5, 5, 55, -5, 5, -55,
			-5, -5, -55, 5, 5, -55, 5, 5, 55, 5, -5, 55, 5, -5, 55, 5, -5, -55,
			5, 5, -55,
			//left back wing
			-5, 0, 30, -20, 1.5, 50, -5, 1.5, 50, -5, 1.5, 50, -20, 1.5, 50, -5,
			-1.5, 50, -5, -1.5, 50, -20, 1.5, 50, -20, -1.5, 50, -5, -1.5, 50,
			-20, -1.5, 50, -5, 0, 30, -5, 0, 30, -20, -1.5, 50, -20, 1.5, 50,
			//right back wing
			5, 0, 30, 5, 1.5, 50, 20, 1.5, 50, 5, 1.5, 50, 5, -1.5, 50, 20, 1.5,
			50, 5, -1.5, 50, 20, -1.5, 50, 20, 1.5, 50, 5, -1.5, 50, 5, 0, 30,
			20, -1.5, 50, 5, 0, 30, 20, 1.5, 50, 20, -1.5, 50,
			//vertical wind
			-0.75, 5, 50, 0.75, 5, 50, 0.75, 25, 50, 0.75, 25, 50, -0.75, 25,
			50, -0.75, 5, 50, -0.75, 5, 50, -0.75, 25, 50, 0, 5, 30, 0.75, 5,
			50, 0, 5, 30, 0.75, 25, 50, -0.75, 25, 50, 0.75, 25, 50, 0, 5, 30,
		]);
		// Set the matrix.
		gl.uniformMatrix4fv(matrixLocation, false, matrix);
		gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
		// Draw the geometry.
		var primitiveType = gl.TRIANGLES;
		var offset = 0;
		gl.drawArrays(primitiveType, offset, positions.length / 3);
	}

	function drawBullet(matrix, viewProjectionMatrix, matrixLocation) {
		matrix = m4.multiply(viewProjectionMatrix, matrix);
		// Set the matrix.
		gl.uniformMatrix4fv(matrixLocation, false, matrix);
		gl.bufferData(gl.ARRAY_BUFFER, bullet_model_position, gl.STATIC_DRAW);
		// Draw the geometry.
		var primitiveType = gl.TRIANGLES;
		var offset = 0;
		gl.drawArrays(primitiveType, offset, bullet_model_position.length / 3);
	}

	function drawArrow(matrix, viewProjectionMatrix, matrixLocation) {
		// multiply that with the viewProjecitonMatrix
		matrix = m4.multiply(viewProjectionMatrix, matrix);
		var positions = new Float32Array([
			0, 2, -10, -10, 2, 0, 10, 2, 0, 0, 2, -10, 0, -2, -10, -10, -2, 0,
			-10, -2, 0, -10, 2, 0, 0, 2, -10, 0, 2, -10, 10, 2, 0, 10, -2, 0,
			10, -2, 0, 0, -2, -10, 0, 2, -10,

			-10, 2, 0, -10, -2, 0, 10, -2, 0, 10, -2, 0, 10, 2, 0, -10, 2, 0, 0,
			-2, -10, 10, -2, 0, -10, -2, 0, 2, 2, 0, -2, 2, 0, -2, 2, 10, -2, 2,
			10, 2, 2, 10, 2, 2, 0, 2, 2, 0, 2, 2, 10, 2, -2, 0, 2, -2, 0, 2, 2,
			10, 2, -2, 10, -2, 2, 0, -2, -2, 0, -2, 2, 10, -2, 2, 10, -2, -2, 0,
			-2, -2, 10, -2, -2, 0, 2, -2, 0, -2, -2, 10, -2, -2, 10, 2, -2, 0,
			2, -2, 10, 2, 2, 10, -2, 2, 10, -2, -2, 10, -2, -2, 10, 2, -2, 10,
			2, 2, 10,
		]);
		// Set the matrix.
		gl.uniformMatrix4fv(matrixLocation, false, matrix);
		gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
		// Draw the geometry.
		var primitiveType = gl.TRIANGLES;
		var offset = 0;
		gl.drawArrays(primitiveType, offset, positions.length / 3);
	}
}

// Fill the buffer with the values that define a letter 'F'.
function setGeometry(gl) {
	var positions = new Float32Array(HeadData.positions);
	var matrix = m4.scale(m4.yRotation(Math.PI), 6, 6, 6);
	for (var ii = 0; ii < positions.length; ii += 3) {
		var vector = m4.transformVector(matrix, [
			positions[ii + 0],
			positions[ii + 1],
			positions[ii + 2],
			1,
		]);
		positions[ii + 0] = vector[0];
		positions[ii + 1] = vector[1];
		positions[ii + 2] = vector[2];
	}
	head_model_position = positions;
	gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
	return positions.length / 3;
}

function setColors(gl) {
	var normals = HeadData.normals;
	var colors = new Uint8Array(normals.length);
	var offset = 0;
	for (var ii = 0; ii < colors.length; ii += 3) {
		for (var jj = 0; jj < 3; ++jj) {
			colors[offset] = (normals[offset] * 0.5 + 0.5) * 255;
			++offset;
		}
	}
	gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
}

function construct_bullet() {
	var r = 2;
	var sqrt2 = Math.sqrt(2);
	var sqrt3 = Math.sqrt(3);
	bullet_model_position = new Float32Array([
		0,
		r,
		0,
		0,
		-r / 3,
		(r * 2 * sqrt2) / 3,
		(r * sqrt2) / sqrt3,
		-r / 3,
		(-r * sqrt2) / 3,
		0,
		r,
		0,
		(r * sqrt2) / sqrt3,
		-r / 3,
		(-r * sqrt2) / 3,
		(-r * sqrt2) / sqrt3,
		-r / 3,
		(-r * sqrt2) / 3,
		0,
		r,
		0,
		(-r * sqrt2) / sqrt3,
		-r / 3,
		(-r * sqrt2) / 3,
		0,
		-r / 3,
		(r * 2 * sqrt2) / 3,
		0,
		-r / 3,
		(r * 2 * sqrt2) / 3,
		(r * sqrt2) / sqrt3,
		-r / 3,
		(-r * sqrt2) / 3,
		(-r * sqrt2) / sqrt3,
		-r / 3,
		(-r * sqrt2) / 3,
	]);
}

var m4 = {
	perspective: function (fieldOfViewInRadians, aspect, near, far) {
		var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
		var rangeInv = 1.0 / (near - far);

		return [
			f / aspect,
			0,
			0,
			0,
			0,
			f,
			0,
			0,
			0,
			0,
			(near + far) * rangeInv,
			-1,
			0,
			0,
			near * far * rangeInv * 2,
			0,
		];
	},

	projection: function (width, height, depth) {
		// Note: This matrix flips the Y axis so 0 is at the top.
		return [
			2 / width,
			0,
			0,
			0,
			0,
			-2 / height,
			0,
			0,
			0,
			0,
			2 / depth,
			0,
			-1,
			1,
			0,
			1,
		];
	},

	multiply: function (a, b) {
		var a00 = a[0 * 4 + 0];
		var a01 = a[0 * 4 + 1];
		var a02 = a[0 * 4 + 2];
		var a03 = a[0 * 4 + 3];
		var a10 = a[1 * 4 + 0];
		var a11 = a[1 * 4 + 1];
		var a12 = a[1 * 4 + 2];
		var a13 = a[1 * 4 + 3];
		var a20 = a[2 * 4 + 0];
		var a21 = a[2 * 4 + 1];
		var a22 = a[2 * 4 + 2];
		var a23 = a[2 * 4 + 3];
		var a30 = a[3 * 4 + 0];
		var a31 = a[3 * 4 + 1];
		var a32 = a[3 * 4 + 2];
		var a33 = a[3 * 4 + 3];
		var b00 = b[0 * 4 + 0];
		var b01 = b[0 * 4 + 1];
		var b02 = b[0 * 4 + 2];
		var b03 = b[0 * 4 + 3];
		var b10 = b[1 * 4 + 0];
		var b11 = b[1 * 4 + 1];
		var b12 = b[1 * 4 + 2];
		var b13 = b[1 * 4 + 3];
		var b20 = b[2 * 4 + 0];
		var b21 = b[2 * 4 + 1];
		var b22 = b[2 * 4 + 2];
		var b23 = b[2 * 4 + 3];
		var b30 = b[3 * 4 + 0];
		var b31 = b[3 * 4 + 1];
		var b32 = b[3 * 4 + 2];
		var b33 = b[3 * 4 + 3];
		return [
			b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
			b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
			b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
			b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
			b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
			b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
			b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
			b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
			b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
			b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
			b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
			b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
			b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
			b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
			b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
			b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
		];
	},

	translation: function (tx, ty, tz) {
		return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, tx, ty, tz, 1];
	},

	xRotation: function (angleInRadians) {
		var c = Math.cos(angleInRadians);
		var s = Math.sin(angleInRadians);

		return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1];
	},

	yRotation: function (angleInRadians) {
		var c = Math.cos(angleInRadians);
		var s = Math.sin(angleInRadians);

		return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1];
	},

	zRotation: function (angleInRadians) {
		var c = Math.cos(angleInRadians);
		var s = Math.sin(angleInRadians);

		return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
	},

	scaling: function (sx, sy, sz) {
		return [sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1];
	},

	translate: function (m, tx, ty, tz) {
		return m4.multiply(m, m4.translation(tx, ty, tz));
	},

	xRotate: function (m, angleInRadians) {
		return m4.multiply(m, m4.xRotation(angleInRadians));
	},

	yRotate: function (m, angleInRadians) {
		return m4.multiply(m, m4.yRotation(angleInRadians));
	},

	zRotate: function (m, angleInRadians) {
		return m4.multiply(m, m4.zRotation(angleInRadians));
	},

	scale: function (m, sx, sy, sz) {
		return m4.multiply(m, m4.scaling(sx, sy, sz));
	},

	inverse: function (m) {
		var m00 = m[0 * 4 + 0];
		var m01 = m[0 * 4 + 1];
		var m02 = m[0 * 4 + 2];
		var m03 = m[0 * 4 + 3];
		var m10 = m[1 * 4 + 0];
		var m11 = m[1 * 4 + 1];
		var m12 = m[1 * 4 + 2];
		var m13 = m[1 * 4 + 3];
		var m20 = m[2 * 4 + 0];
		var m21 = m[2 * 4 + 1];
		var m22 = m[2 * 4 + 2];
		var m23 = m[2 * 4 + 3];
		var m30 = m[3 * 4 + 0];
		var m31 = m[3 * 4 + 1];
		var m32 = m[3 * 4 + 2];
		var m33 = m[3 * 4 + 3];
		var tmp_0 = m22 * m33;
		var tmp_1 = m32 * m23;
		var tmp_2 = m12 * m33;
		var tmp_3 = m32 * m13;
		var tmp_4 = m12 * m23;
		var tmp_5 = m22 * m13;
		var tmp_6 = m02 * m33;
		var tmp_7 = m32 * m03;
		var tmp_8 = m02 * m23;
		var tmp_9 = m22 * m03;
		var tmp_10 = m02 * m13;
		var tmp_11 = m12 * m03;
		var tmp_12 = m20 * m31;
		var tmp_13 = m30 * m21;
		var tmp_14 = m10 * m31;
		var tmp_15 = m30 * m11;
		var tmp_16 = m10 * m21;
		var tmp_17 = m20 * m11;
		var tmp_18 = m00 * m31;
		var tmp_19 = m30 * m01;
		var tmp_20 = m00 * m21;
		var tmp_21 = m20 * m01;
		var tmp_22 = m00 * m11;
		var tmp_23 = m10 * m01;

		var t0 =
			tmp_0 * m11 +
			tmp_3 * m21 +
			tmp_4 * m31 -
			(tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31);
		var t1 =
			tmp_1 * m01 +
			tmp_6 * m21 +
			tmp_9 * m31 -
			(tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31);
		var t2 =
			tmp_2 * m01 +
			tmp_7 * m11 +
			tmp_10 * m31 -
			(tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
		var t3 =
			tmp_5 * m01 +
			tmp_8 * m11 +
			tmp_11 * m21 -
			(tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);

		var d = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);

		return [
			d * t0,
			d * t1,
			d * t2,
			d * t3,
			d *
				(tmp_1 * m10 +
					tmp_2 * m20 +
					tmp_5 * m30 -
					(tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30)),
			d *
				(tmp_0 * m00 +
					tmp_7 * m20 +
					tmp_8 * m30 -
					(tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30)),
			d *
				(tmp_3 * m00 +
					tmp_6 * m10 +
					tmp_11 * m30 -
					(tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30)),
			d *
				(tmp_4 * m00 +
					tmp_9 * m10 +
					tmp_10 * m20 -
					(tmp_5 * m00 + tmp_8 * m10 + tmp_11 * m20)),
			d *
				(tmp_12 * m13 +
					tmp_15 * m23 +
					tmp_16 * m33 -
					(tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33)),
			d *
				(tmp_13 * m03 +
					tmp_18 * m23 +
					tmp_21 * m33 -
					(tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33)),
			d *
				(tmp_14 * m03 +
					tmp_19 * m13 +
					tmp_22 * m33 -
					(tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33)),
			d *
				(tmp_17 * m03 +
					tmp_20 * m13 +
					tmp_23 * m23 -
					(tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23)),
			d *
				(tmp_14 * m22 +
					tmp_17 * m32 +
					tmp_13 * m12 -
					(tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22)),
			d *
				(tmp_20 * m32 +
					tmp_12 * m02 +
					tmp_19 * m22 -
					(tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02)),
			d *
				(tmp_18 * m12 +
					tmp_23 * m32 +
					tmp_15 * m02 -
					(tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12)),
			d *
				(tmp_22 * m22 +
					tmp_16 * m02 +
					tmp_21 * m12 -
					(tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02)),
		];
	},

	cross: function (a, b) {
		return [
			a[1] * b[2] - a[2] * b[1],
			a[2] * b[0] - a[0] * b[2],
			a[0] * b[1] - a[1] * b[0],
		];
	},

	subtractVectors: function (a, b) {
		return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
	},

	normalize: function (v) {
		var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
		// make sure we don't divide by 0.
		if (length > 0.00001) {
			return [v[0] / length, v[1] / length, v[2] / length];
		} else {
			return [0, 0, 0];
		}
	},

	lookAt: function (cameraPosition, target, up) {
		var zAxis = m4.normalize(m4.subtractVectors(cameraPosition, target));
		var xAxis = m4.normalize(m4.cross(up, zAxis));
		var yAxis = m4.normalize(m4.cross(zAxis, xAxis));

		return [
			xAxis[0],
			xAxis[1],
			xAxis[2],
			0,
			yAxis[0],
			yAxis[1],
			yAxis[2],
			0,
			zAxis[0],
			zAxis[1],
			zAxis[2],
			0,
			cameraPosition[0],
			cameraPosition[1],
			cameraPosition[2],
			1,
		];
	},

	transformVector: function (m, v) {
		var dst = [];
		for (var i = 0; i < 4; ++i) {
			dst[i] = 0.0;
			for (var j = 0; j < 4; ++j) {
				dst[i] += v[j] * m[j * 4 + i];
			}
		}
		return dst;
	},
};

document.body.addEventListener("keydown", (e) => {
	keysPressed[e.key] = true;
});
document.body.addEventListener("keyup", (e) => {
	delete keysPressed[e.key];
});

construct_bullet();
main();
