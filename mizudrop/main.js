var size = 0;
var st = 0;
var et = 0;
var speed = 0;

function uploadFile() {
	$("#fs").click();
}

function filesize_to_human(size) {
	var unit = [" B", " KB", " MB", " GB"];
	var c = 0;
	while (size > 1023) {
		size /= 1024;
		c++;
	}
	size = Math.round(size * 100) / 100;
	return String(size) + unit[c];
}

$("#fs").change(function () {
	if ($("#fs").prop("files").length > 0) {
		var file = $("#fs").prop("files")[0];
		var peer = new Peer({
			config: {
				iceServers: [
					{
						urls: "stun:openrelay.metered.ca:80",
					},
					{
						urls: "turn:openrelay.metered.ca:80",
						username: "openrelayproject",
						credential: "openrelayproject",
					},
					{
						urls: "turn:openrelay.metered.ca:443",
						username: "openrelayproject",
						credential: "openrelayproject",
					},
					{
						urls: "turn:openrelay.metered.ca:443?transport=tcp",
						username: "openrelayproject",
						credential: "openrelayproject",
					},
				],
			},
		});
		peer.on("open", function (id) {
			$("#img").hide();
			$("#imga").prop("onclick", null).off("click");
			$("#imga").css("background-color", "white");
			$("<a>", {
				id: "peerlink",
				href: "index.html?peerid=" + peer.id,
				target: "_blank",
			}).appendTo("#imga");
			$("#peerlink").qrcode($("#peerlink").prop("href"));
			size = file.size;
			$("#step1").html(
				$("#step1").html() + " (" + filesize_to_human(size) + ")"
			);
			newstep(2, "2. 等待對方連接");
		});
		peer.on("connection", function (conn) {
			conn.on("open", function () {
				code = String(Math.floor(Math.random() * 100000)).padStart(
					6,
					"0"
				);
				conn.send({ type: "check", data: file.size });
				newstep(3, "3. 請在對面輸入: " + code);
				conn.on("data", function (data) {
					received(conn, data);
				});
			});
		});
	}
});

function newstep(n, text) {
	$("#step" + (n - 1)).html(
		"<h5><s>" + $("#step" + (n - 1)).html() + "</s></h5>"
	);
	$("#step" + (n - 1)).addClass("text-muted");
	$("<div>", {
		id: "step" + n,
	})
		.html(text)
		.appendTo("#inform");
}

function getUrlParameter(sParam) {
	var sPageURL = window.location.search.substring(1),
		sURLVariables = sPageURL.split("&"),
		sParameterName,
		i;

	for (i = 0; i < sURLVariables.length; i++) {
		sParameterName = sURLVariables[i].split("=");

		if (sParameterName[0] === sParam) {
			return sParameterName[1] === undefined
				? true
				: decodeURIComponent(sParameterName[1]);
		}
	}
	return false;
}

peerid = getUrlParameter("peerid");
if (peerid) {
	$("#imga").prop("onclick", null).off("click");
	$("#img").prop("src", "download.svg");
	var peer = new Peer({
		config: {
			iceServers: [
				{
					urls: "stun:openrelay.metered.ca:80",
				},
				{
					urls: "turn:openrelay.metered.ca:80",
					username: "openrelayproject",
					credential: "openrelayproject",
				},
				{
					urls: "turn:openrelay.metered.ca:443",
					username: "openrelayproject",
					credential: "openrelayproject",
				},
				{
					urls: "turn:openrelay.metered.ca:443?transport=tcp",
					username: "openrelayproject",
					credential: "openrelayproject",
				},
			],
		},
	});
	newstep(1, "1. 等待建立連接");
	peer.on("open", function (id) {
		var conn = peer.connect(peerid);
		conn.on("open", function () {
			$("#another_id").text(conn.peer);
			conn.on("data", function (data) {
				received(conn, data);
			});
		});
	});
} else {
	$("#imga").click(function () {
		uploadFile();
	});
	$("#img").prop("src", "upload.svg");
	newstep(1, "1. 點擊上方圖示選取檔案");
}

function received(conn, data) {
	if (data.type == "file") {
		newstep(4, "傳輸中...");
		receiveFile(data.data);
		et = Date.now();
		conn.send({ type: "complete", time: et });
		$("#img").prop("src", "done.svg");
		newstep(
			5,
			"傳輸完成，感謝你的使用<p>速度: " +
				filesize_to_human((size * 1000) / (et - st)) +
				"/s"
		);
	} else if (data.type == "check") {
		size = data.data;
		newstep(
			2,
			"2. 連接成功，傳輸檔案大小 " +
				filesize_to_human(size) +
				"<p>請輸入金鑰接收檔案"
		);
		var input_code = $("<input>", {
			type: "text",
			id: "input_code",
			placeholder: "請輸入6位數金鑰",
		});
		input_code.keypress(function (e) {
			code = e.keyCode ? e.keyCode : e.which;
			if (code == 13) {
				conn.send({ type: "code", data: input_code.val() });
			}
		});
		input_code.appendTo("#inform");
	} else if (data.type == "result") {
		if (data.data) {
			newstep(3, "3. 驗證成功，等待傳送");
			$("#input_code").remove();
			st = data.time;
		} else {
			alert("驗證失敗");
		}
	} else if (data.type == "code") {
		if (code == data.data) {
			newstep(4, "傳輸中...");
			st = Date.now();
			conn.send({ type: "result", data: true, time: st });
			sendFile(conn);
		} else {
			conn.send({ type: "result", data: false });
		}
	} else if (data.type == "complete") {
		et = data.time;
		newstep(
			5,
			"傳輸完成，感謝你的使用<p>速度: " +
				filesize_to_human((size * 1000) / (et - st)) +
				"/s"
		);
		$("#imga").css("background-color", "");
		$("#peerlink").remove();
		$("#img").prop("src", "done.svg");
		$("#img").show();
	}
}

function receiveFile(data) {
	var blob = new Blob([data.file], { type: data.filetype });
	var url = URL.createObjectURL(blob);
	var id = Date.now();
	$("<a>", {
		id: id,
		href: url,
		download: data.filename,
		//style: "display:none;",
	})
		.html(data.filename)
		.appendTo("#inform");

	//$("#" + id).trigger("click");
}

function sendFile(conn) {
	var file = $("#fs").prop("files")[0];
	var blob = new Blob($("#fs").prop("files"), { type: file.type });
	conn.send({
		type: "file",
		data: {
			file: blob,
			filename: file.name,
			filetype: file.type,
		},
	});
}
