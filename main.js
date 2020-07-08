var num = 0;
const commands = ["RAS", "ECHO", "PIXIV", "SYSTEM"];
function focus_card(jname) {
    $(".card").not(jname).css("z-index", "auto");
    $(jname).css("z-index", "999");
    $(jname).children('.card-header').addClass("bg-primary");
    $(".card").not(jname).children('.card-header').removeClass("bg-primary");
}
$(document).ready(function () {
    $('.card').css("position", "fixed");
    $('.card').hide();
    var n = 0;
    var boot_count = setInterval(function () {
        n += Math.floor(Math.random() * 20);
        if (n > 100) n = 100;
        $('#bootP').css("width", n.toString() + "%");
        $('#bootP').html(n.toString() + "%");
        if (n == 100) {
            $('#Booting').fadeOut("slow", function () {
                $('#Booting').remove();
                clearInterval(boot_count);
            });
        }
    }, 500);

    setInterval(function () {
        var time = new Date();
        $('#NowTime').html(((time.getHours() < 10) ? "0" : "") + time.getHours() + ":" + ((time.getMinutes() < 10) ? "0" : "") + time.getMinutes() + ":" + ((time.getSeconds() < 10) ? "0" : "") + time.getSeconds());
    }, 500);
});
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
    $(this).parent().parent().parent().parent().hide();
});
$("#termizu, #search").click(function () {
    $("#termizu-card").show();
    focus_card("#termizu-card");
});

$("#YT").click(function () {
    $("#about-card").show();
    focus_card("#about-card");
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

$('#termizu').on('shown.bs.modal', function () {
    $('#login_form_command').focus();
})
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
$("#doMagic").click(function () {
    $("#doMagic").toggle("explode", {}, 1500, function () {
        $("#doMagic").html("騙你的")
        $("#doMagic").fadeIn();
    });
});
$(document).keydown(function (e) {
    if (e.ctrlKey) {
        $("#modalLoginForm").modal("show");
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