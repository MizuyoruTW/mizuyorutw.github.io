var num = 0;
const commands = ["RAS", "ECHO", "PIXIV", "SYSTEM"];

function focus_card(jname) {
    $(".card").not(jname).css("z-index", "auto");
    $(jname).css("z-index", "999");
    $(jname).children('.card-header').addClass("bg-primary");
    $(".card").not(jname).children('.card-header').removeClass("bg-primary");
}

$(document).ready(function () {
    loadlive2d("live2d", "./assets/live2d_model/model.json");
    $('.card').css("position", "fixed");
    $('.card').hide();
    //boot
    $.get("https://api.github.com/search/users?q=MizuyoruTW", function (result) {
        $("#profile_img").attr("src", result["items"][0]["avatar_url"]);
        changeText($("#bootingMSG"), "連線成功，下載資料中");
        $("#profile_img").on("load", function () {
            $("#profile_img, #bootPP").fadeIn();
            changeText($("#bootingMSG"), "下載完成，載入中...");;
            var n = 0;
            var boot_count = setInterval(function () {
                n += Math.floor(Math.random() * 20);
                if (n > 100) n = 100;
                $('#bootP').css("width", n.toString() + "%");
                $('#bootP').html(n.toString() + "%");
                if (n == 100) {
                    clearInterval(boot_count);
                    changeText($("#bootingMSG"), "歡迎");
                    setTimeout(function () {
                        $('#Booting').fadeOut("slow", function () {
                            $('#Booting').remove();
                        });
                    }, 2000);
                }
            }, 500);
        });
    });
    //get current time
    setInterval(function () {
        var time = new Date();
        $('#NowTime').html(((time.getHours() < 10) ? "0" : "") + time.getHours() + ":" + ((time.getMinutes() < 10) ? "0" : "") + time.getMinutes() + ":" + ((time.getSeconds() < 10) ? "0" : "") + time.getSeconds());
    }, 500);
});

//change text with fade animation
function changeText(target, text) {
    target.fadeOut(200, function () {
        $(this).html(text).fadeIn(200);
    });
}

$(".card").draggable({
    containment: "parent",
    start: function () {
        focus_card(this);
    }
});

$(".card").click(
    function () {
        focus_card(this);
    }
);

$('.close').click(function () {
    $(".card").not(this).css("position", "absolute");
    $(this).parent().parent().parent().parent().fadeOut(100);
});

$("#termizu").click(function () {
    $("#termizu-card").fadeIn(100);
    $('#login_form_command').focus();
    focus_card("#termizu-card");
});

$("#YT").click(function () {
    $("#YTP-card").fadeIn(100);
    focus_card("#YTP-card");
});

$("#Settings").click(function () {
    $("#setting-card").fadeIn(100);
    focus_card("#setting-card");
});

$("#sleep").click(function () {
    $('#sleepSCN').fadeIn("slow");
});

$("#sleepSCN").click(function () {
    $('#sleepSCN').fadeOut("slow");
});

$("#youtube_id").keypress(function (e) {
    code = (e.keyCode ? e.keyCode : e.which);
    if (code == 13) {
        var text = $("#youtube_id").val();
        if (text.includes('youtube')) {
            text = text.replace("https://www.youtube.com/watch?v=", "");
        }
        $('#YTembed').attr("src", "https://www.youtube.com/embed/" + text + "?autoplay=1&loop=1&playlist=" + text);

    }
});

$("#login_btn").click(function () {
    summit_command();
});

$("#login_form_command").keypress(function (e) {
    code = (e.keyCode ? e.keyCode : e.which);
    if (code == 13) {
        $('#login_form_argv').focus();
    }
});

$("#login_form_argv").keypress(function (e) {
    code = (e.keyCode ? e.keyCode : e.which);
    if (code == 13) {
        summit_command();
    }
});

function summit_command() {
    $('#login_form_command').removeClass("is-invalid");
    var index = commands.indexOf($("#login_form_command").val().toUpperCase());
    switch (index) {
        case 0://RAS
            window.open("https://bang-dream.bushimo.jp/raise-a-suilen/");
            break;
        case 1://echo
            alert($('#login_form_argv').val());
            break
        case 2://pixiv
            url = "https://www.pixiv.net/artworks/" + $('#login_form_argv').val();
            window.open(url);
            break;
        case 3://system
            window.open("/system.html", "_self");
            break;
        default:
            $('#login_form_command').addClass("is-invalid");
            $('#login_form_command').effect("shake");
    }
    if (index > -1) {
        $("#login_form_command").val('');
        $("#login_form_argv").val('');
    }
    $('#login_form_command').focus();
}