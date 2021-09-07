var current_file = "";
var translations = {};
var content = "";
var HtmlEncode = (s) => {
	var el = document.createElement("div");
	el.innerText = el.textContent = s;
	s = el.innerHTML;
	return s;
};

var highlight = (res) => {
	if (getCook("lang") == "tw") {
		for (const [key, value] of Object.entries(translations)) {
			res = res.replaceAll(key, value);
		}
	}
	//taiwan
	res = res.replace("Taiwan", "Taiwan&#127481;&#127484;");
	//quote
	res = res.replace(/(\".+?\")/g, "<span class='code_sand'>$1</span>");
	//link
	res = res.replace(
		/(https\:\/\/[0-9a-zA-Z\.\/\?\=]+)/g,
		"<a href='$1' target='_blank'>$1</a>"
	);
	//comment
	res = res.replace(/(\/\*.+?\*\/)/g, "<span class='code_green'>$1</span>");
	//license file
	res = res.replace(
		"LICENSE",
		`<a href='#' onclick="$('#license_ahref')[0].click()">LICENSE</a>`
	);
	return res;
};

var load_file = (elem) => {
	filename = $.trim($(elem).text());
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
			content = res;
			display_content();
		},
		error: function (err) {
			console.log(err);
			alert("Load file failed.");
		},
	});
};

$(document).ready(() => {
	if (getCook("lang") == "tw") {
		set_locale("tw");
	} else {
		set_locale("en");
	}
	$("#download_file").click((e) => {
		e.preventDefault();
		window.location.href = current_file;
	});
	$.ajax({
		url: "translations.json",
		method: "GET",
		dataType: "json",
		success: function (res) {
			translations = res;
		},
		error: function (err) {
			console.log(err);
		},
	});
});

//得到cookies的指定欄位值
function getCook(cookiename) {
	// Get name followed by anything except a semicolon
	var cookiestring = RegExp(cookiename + "=[^;]+").exec(document.cookie);
	// Return everything after the equal sign, or an empty string if the cookie name not found
	return decodeURIComponent(
		!!cookiestring ? cookiestring.toString().replace(/^[^=]+./, "") : ""
	);
}

function setCookie(name, value, days) {
	var expires = "";
	if (days) {
		var date = new Date();
		date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
		expires = "; expires=" + date.toUTCString();
	}
	document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function set_locale(lang) {
	setCookie("lang", lang, "30");
	$("a[id^='lang-'").each(function (element) {
		$(this).removeClass("dropdown-item-checked");
	});
	$("#lang-" + lang).addClass("dropdown-item-checked");
	if (current_file != "") {
		display_content();
	}
}

function display_content() {
	$(".code_area").empty();
	$(".code_area").append(highlight(HtmlEncode(content)));
}
