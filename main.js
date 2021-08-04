var current_file = "";
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
			lines = res.split("\n");
			lines.forEach((element, index) => {
				var num = (index + 1).toString();
				if (num < 10) {
					num = "0" + num;
				}
				$(".code_area").append(`<p>${num}&emsp;${element}</p>`);
			});
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
