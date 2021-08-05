var current_file = "";

var HtmlEncode = (s) => {
	var el = document.createElement("div");
	el.innerText = el.textContent = s;
	s = el.innerHTML;
	return s;
};

var highlight = (res) => {
	//taiwan
	res = res.replace("Taiwan", "Taiwan&#127481;&#127484;");
	//quote
	res = res.replace(/(\".+?\")/g, "<span class='code_sand'>$1</span>");
	//link
	res = res.replace(
		/\"(https\:\/\/.+?)\"/g,
		"&quot;<a href='$1' target='_blank'>$1</a>&quot;"
	);
	return res;
};

var load_file = (elem) => {
	filename = $.trim($(elem).text());
	$(".code_area").empty();
	$("#file_list li a").each(function () {
		$(this).removeClass("active");
	});
	$(elem).addClass("active");
	$.ajax({
		url: filename,
		method: "GET",
		dataType: "text",
		success: function (res) {
			current_file = filename;
			res = HtmlEncode(res);
			res = highlight(res);
			$(".code_area").append(res);
		},
		error: function (err) {
			console.log(err);
			alert("Load file failed.");
		},
	});
};

$(document).ready(() => {
	$("#download_file").click((e) => {
		e.preventDefault();
		window.location.href = current_file;
	});
});
