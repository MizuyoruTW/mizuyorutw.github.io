$(document).ready(() => {
	url_param = getURLParameter("url");
	if (url_param == "cat_do_backflip") {
		url_param = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
	} else if (url_param == "") {
		url_param = "https://github.com/MizuyoruTW";
	}
	updateProgressBar(0, url_param);
});

function getURLParameter(sParam) {
	var sPageURL = window.location.search.substring(1);
	var sURLVariables = sPageURL.split("&");
	for (var i = 0; i < sURLVariables.length; i++) {
		var sParameterName = sURLVariables[i].split("=");
		if (sParameterName[0] == sParam) {
			sParameterName.shift();
			return sParameterName.join("=");
		}
	}
	return "";
}

statusText = [
	"Defending DDoS",
	"Checking Virus",
	"Connecting to Server",
	"Establishing SSL handshake",
	"Making Coffee☕",
	"Baking Cookies🍪",
	"Caching Website",
	"Downloading images",
	"Washing hands🧼",
	"Wearing mask😷",
	"Why it's so slow?",
	"Using Firefox to check online status",
	"Windows BSOD, changing to Linux",
	"It seems be OK",
	"Out of memory, retrying...",
];
function updateProgressBar(n = 0, url = "#") {
	if (n == 6) {
		document.cookie = "BakeTime=" + Date.now();
	} else if (n >= statusText.length) {
		n = statusText.length - 1;
	}
	oldVal = parseInt($(".progress-bar").attr("aria-valuenow"));
	newVal = oldVal + Math.random() * 20;
	if (newVal >= 100) {
		$(".status").text("Status: Redirecting");
		$(".progress-bar").css("width", "100%").attr("aria-valuenow", 100);
		setTimeout(function () {
			window.location.replace(url);
		}, 500);
	} else {
		$(".progress-bar")
			.css("width", newVal + "%")
			.attr("aria-valuenow", newVal);

		$(".status").text("Status: " + statusText[n]);
		setTimeout(function () {
			updateProgressBar(n + 1, url);
		}, Math.random() * 1000);
	}
}
