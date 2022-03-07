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
			$("#img").remove();
			$("#imga").prop("onclick", null).off("click");
			$("#imga").css("background-color", "white");
			$("<a>", {
				id: "peerlink",
				href: "index.html?peerid=" + peer.id,
				target: "_blank",
			})
				.html(peer.id)
				.appendTo("#inform");
			$("#imga").qrcode($("#peerlink").prop("href"));
			$("<div>").html(filesize_to_human(file.size)).appendTo("#inform");
		});
		peer.on("connection", function (conn) {
			conn.on("open", function () {
				code = String(Math.floor(Math.random() * 100000)).padStart(
					6,
					"0"
				);
				conn.send({ type: "check" });
				alert("請在對面輸入\n" + code);
				conn.on("data", function (data) {
					received(conn, data);
				});
			});
		});
	}
});

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
	peer.on("open", function (id) {
		var conn = peer.connect(peerid);
		conn.on("open", function () {
			$("#another_id").text(conn.peer);
			conn.on("data", function (data) {
				received(conn, data);
			});
		});
	});
}

function received(conn, data) {
	if (data.type == "text") {
		new_line(data.data, "start");
	} else if (data.type == "file") {
		receiveFile(data.data);
	} else if (data.type == "check") {
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
		input_code.appendTo("#imga");
	} else if (data.type == "result") {
		if (data.data) {
			alert("驗證成功，等待傳送");
			$("#input_code").remove();
		} else {
			alert("驗證失敗");
		}
	} else if (data.type == "code") {
		if (code == data.data) {
			conn.send({ type: "result", data: true });
			sendFile(conn);
		} else {
			conn.send({ type: "result", data: false });
		}
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
