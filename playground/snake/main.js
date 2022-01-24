"use strict";

var vertexShaderSource = `#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec2 a_position;

// Used to pass in the resolution of the canvas
uniform vec2 u_resolution;

// A matrix to transform the positions by
uniform mat3 u_matrix;

// all shaders have a main function
void main() {
  // Multiply the position by the matrix.
  vec2 position = (u_matrix * vec3(a_position, 1)).xy;

  // convert the position from pixels to 0.0 to 1.0
  vec2 zeroToOne = position / u_resolution;

  // convert from 0->1 to 0->2
  vec2 zeroToTwo = zeroToOne * 2.0;

  // convert from 0->2 to -1->+1 (clipspace)
  vec2 clipSpace = zeroToTwo - 1.0;

  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
  gl_PointSize = 10.0;
}
`;

var fragmentShaderSource = `#version 300 es

precision highp float;

uniform vec4 u_color;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
  outColor = u_color;
}
`;

var score = 0;
var position = [canvas.clientWidth / 2, canvas.clientHeight / 2];
var range = [canvas.clientWidth, canvas.clientHeight];
var point_color = [Math.random(), Math.random(), Math.random(), 1];
var head_color = [132 / 255, 3 / 255, 252 / 255, 1];
var then = 0;
var speed = 0.0;
var angle_speed = 150.0;
var face_angle = 90;
var bara = 0;
var shippo_angle = 10;
var points_count = 10;
var temp = 0;
var keysPressed = {};

function main() {
	// Get A WebGL context
	/** @type {HTMLCanvasElement} */
	var canvas = document.querySelector("#canvas");
	var score_canvas = document.querySelector("#score");

	var gl = canvas.getContext("webgl2");
	var ctx = score_canvas.getContext("2d");
	score_canvas.width = score_canvas.clientWidth;
	score_canvas.height = score_canvas.clientHeight;
	ctx.font = "20px serif";
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.fillText("" + score, 5, 20);
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

	// look up uniform locations
	var resolutionUniformLocation = gl.getUniformLocation(
		program,
		"u_resolution"
	);
	var colorLocation = gl.getUniformLocation(program, "u_color");
	var matrixLocation = gl.getUniformLocation(program, "u_matrix");

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

	// Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
	var size = 2; // 2 components per iteration
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

	// =============================================================================

	document.body.addEventListener("keydown", (e) => {
		if (e.key == "f") {
			use_robot = !use_robot;
			if (use_robot) {
				robot();
			}
		}
		if (!use_robot) {
			keysPressed[e.key] = true;
		}
	});
	document.body.addEventListener("keyup", (e) => {
		delete keysPressed[e.key];
	});

	random_points(points_count, range[0], range[1]);
	// Set Geometry.
	setGeometry(gl);

	requestAnimationFrame(drawScene);
	var position_queue = [];
	// Draw the scene.
	function drawScene(now) {
		webglUtils.resizeCanvasToDisplaySize(gl.canvas);
		// Tell WebGL how to convert from clip space to pixels
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

		// Clear the canvas
		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		// Tell it to use our program (pair of shaders)
		gl.useProgram(program);

		// Bind the attribute/buffer set we want.
		gl.bindVertexArray(vao);

		// Pass in the canvas resolution so we can convert from
		// pixels to clipspace in the shader
		gl.uniform2f(
			resolutionUniformLocation,
			gl.canvas.width,
			gl.canvas.height
		);
		//=====================================================
		now *= 0.001;
		var deltaTime = now - then;
		then = now;
		//calculate speed
		if (keysPressed["w"]) {
			if (speed < 500) speed += (500 - speed) / 10;
		} else if (keysPressed["s"]) {
			if (speed > 0) speed -= speed / 10;
		} else if (speed != 120) {
			speed += (120 - speed) / 20;
		}
		if (speed < 0) speed = 0;

		//calculate face angle
		let radian = (face_angle / 180) * Math.PI;
		let s = speed * deltaTime;
		position[0] += Math.cos(radian) * s;
		position[1] -= Math.sin(radian) * s;

		if (keysPressed["a"] || keysPressed["d"]) {
			let r = keysPressed["a"] ? 1 : -1;
			face_angle = (face_angle + angle_speed * deltaTime * r) % 360;
			if (face_angle < 0) face_angle += 360;
		}

		//prevent out of range
		if (position[0] > range[0]) position[0] = range[0];
		if (position[1] > range[1]) position[1] = range[1];
		if (position[0] < 0) position[0] = 0;
		if (position[1] < 0) position[1] = 0;

		//add track
		position_queue.push(position[0]);
		position_queue.push(position[1]);
		if (position_queue.length > 200) {
			position_queue.shift();
			position_queue.shift();
		}

		// draw head
		var matrix = m3.identity();
		matrix = m3.multiply(matrix, m3.translation(position[0], position[1]));
		matrix = m3.multiply(matrix, m3.rotation((face_angle / 180) * Math.PI));
		gl.uniformMatrix3fv(matrixLocation, false, matrix);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array(points),
			gl.STATIC_DRAW
		);
		gl.drawArrays(gl.TRIANGLES, 0, 3);

		//draw body
		for (var i = 0; i < bara; ++i) {
			matrix = m3.multiply(matrix, m3.translation(-30, 0));
			matrix = m3.multiply(
				matrix,
				m3.rotation(
					//make tail wave
					((shippo_angle * Math.sin(now * 4)) / 180) * Math.PI
				)
			);
			gl.uniformMatrix3fv(matrixLocation, false, matrix);
			gl.drawArrays(gl.TRIANGLES, 0, 3);
		}

		//draw points
		for (var i = 6; i < points.length; i += 2) {
			let x = points[i];
			let y = points[i + 1];
			let dis =
				Math.pow(position[0] - x, 2) + Math.pow(position[1] - y, 2);
			if (dis < 400) {
				//point eaten
				robot_found = true;
				if (bara < 10) ++bara;
				points.splice(i, 2);
				x = Math.random() * range[0];
				y = Math.random() * range[1];
				points.push(x);
				points.push(y);
				score += 1;
				break;
			}
		}
		gl.uniformMatrix3fv(matrixLocation, false, m3.identity());
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array(points),
			gl.STATIC_DRAW
		);
		gl.uniform4fv(colorLocation, point_color);
		gl.drawArrays(gl.POINTS, 3, points_count);

		//draw track
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array(position_queue),
			gl.STATIC_DRAW
		);
		gl.uniform4fv(colorLocation, head_color);
		gl.drawArrays(gl.LINE_STRIP, 0, position_queue.length / 2);

		//update score board
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		ctx.fillText("Score: " + score, 5, 20);
		ctx.fillText(
			"Position: (" +
				Math.round(position[0]) +
				", " +
				Math.round(position[1]) +
				")",
			5,
			40
		);
		ctx.fillText("Speed: " + Math.round(speed) + "px/s", 5, 60);
		ctx.fillText("Face angle: " + Math.round(face_angle) + "°", 5, 80);
		ctx.fillText("Robot: " + use_robot, 5, 100);
		if (use_robot) {
			ctx.fillText("Press F to turn off the robot", 5, 120);
		} else {
			ctx.fillText("Press F to turn on the robot", 5, 120);
			ctx.fillText("Press W to speed up", 5, 140);
			ctx.fillText("Press S to slow down", 5, 160);
			ctx.fillText("Press A to turn left", 5, 180);
			ctx.fillText("Press D to turn right", 5, 200);
		}

		//next call
		requestAnimationFrame(drawScene);
	}
}

// Fill the current ARRAY_BUFFER buffer
// with the values that define a letter 'F'.
var points = [0, 0, -30, -30, -30, 30];
function setGeometry(gl) {
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
}

function random_points(c, w, h) {
	for (var i = 0; i < c; ++i) {
		let x = Math.random() * w;
		let y = Math.random() * h;
		points.push(x);
		points.push(y);
	}
}

var m3 = {
	identity: function identity() {
		return [1, 0, 0, 0, 1, 0, 0, 0, 1];
	},

	translation: function translation(tx, ty) {
		return [1, 0, 0, 0, 1, 0, tx, ty, 1];
	},

	rotation: function rotation(angleInRadians) {
		var c = Math.cos(angleInRadians);
		var s = Math.sin(angleInRadians);
		return [c, -s, 0, s, c, 0, 0, 0, 1];
	},

	scaling: function scaling(sx, sy) {
		return [sx, 0, 0, 0, sy, 0, 0, 0, 1];
	},

	multiply: function multiply(a, b) {
		var a00 = a[0 * 3 + 0];
		var a01 = a[0 * 3 + 1];
		var a02 = a[0 * 3 + 2];
		var a10 = a[1 * 3 + 0];
		var a11 = a[1 * 3 + 1];
		var a12 = a[1 * 3 + 2];
		var a20 = a[2 * 3 + 0];
		var a21 = a[2 * 3 + 1];
		var a22 = a[2 * 3 + 2];
		var b00 = b[0 * 3 + 0];
		var b01 = b[0 * 3 + 1];
		var b02 = b[0 * 3 + 2];
		var b10 = b[1 * 3 + 0];
		var b11 = b[1 * 3 + 1];
		var b12 = b[1 * 3 + 2];
		var b20 = b[2 * 3 + 0];
		var b21 = b[2 * 3 + 1];
		var b22 = b[2 * 3 + 2];

		return [
			b00 * a00 + b01 * a10 + b02 * a20,
			b00 * a01 + b01 * a11 + b02 * a21,
			b00 * a02 + b01 * a12 + b02 * a22,
			b10 * a00 + b11 * a10 + b12 * a20,
			b10 * a01 + b11 * a11 + b12 * a21,
			b10 * a02 + b11 * a12 + b12 * a22,
			b20 * a00 + b21 * a10 + b22 * a20,
			b20 * a01 + b21 * a11 + b22 * a21,
			b20 * a02 + b21 * a12 + b22 * a22,
		];
	},
};

main();

var use_robot = false;
var robot_found = false;
function robot() {
	robot_found = false;
	//find nearest point
	var target_index = Math.floor(Math.random() * points_count);
	var target_point = [
		points[target_index * 2 + 6],
		points[target_index * 2 + 7],
	];
	var min = 9999999;
	for (var i = 0; i < points_count; ++i) {
		var p = [points[i * 2 + 6], points[i * 2 + 7]];
		var d = Math.sqrt(
			Math.pow(position[0] - p[0], 2) + Math.pow(position[1] - p[1], 2)
		);
		if (d < min) {
			target_point = p;
			min = d;
		}
	}
	function find_direction() {
		keysPressed["s"] = true; //stop going forward
		if (!use_robot) {
			//turn off robot
			keysPressed = {};
			return;
		}
		//calculate turning angle to the target
		var target_angle =
			(Math.atan2(
				position[1] - target_point[1],
				target_point[0] - position[0]
			) /
				Math.PI) *
			180;
		if (target_angle < 0) target_angle += 360;
		var diff = target_angle - face_angle;
		var key = "";
		var sec = 0;
		//calculate how much time should the robot press the key
		if (diff < 0) {
			key = "d";
			sec = -diff / angle_speed;
			if (-diff > 360 + diff) {
				key = "a";
				sec = (360 + diff) / angle_speed;
			}
		} else {
			key = "a";
			sec = diff / angle_speed;
			if (diff > 360 - diff) {
				key = "d";
				sec = (360 - diff) / angle_speed;
			}
		}
		keysPressed[key] = true;
		setTimeout(function () {
			//release the key for a few second and go forward for 1 second
			delete keysPressed[key];
			keysPressed["w"] = true;
			setTimeout(function () {
				delete keysPressed["w"];
				if (robot_found) {
					setTimeout(robot, 1000);
				} else {
					setTimeout(find_direction, 1000);
				}
			}, 1000);
		}, sec * 1000);
	}
	find_direction();
}
