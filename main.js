var num = 0;
const commands = ["RAS", "ECHO", "ASSIGN", "PIXIV", "SYSTEM"];
$(document).ready(function () {
    $('#LoadingPage').remove();
    $('main').fadeIn(1500);
    $('#FakeNews').easyTicker({
        direction: 'up',
        easing: 'swing',
        speed: 'slow',
        interval: 3000,
        height: 'auto',
        visible: 1,
        mousePause: true,
        controls: {
            up: '',
            down: '',
            toggle: '',
            playText: 'Play',
            stopText: 'Stop'
        },
        callbacks: {
            before: false,
            after: false
        }
    });
});
$("#FakeNews, #termizu, #search").click(function () {
    $("#modalLoginForm").modal("show");
});

$("#shutdown").click(function () {
    alert("自己關掉")
});

$('#modalLoginForm').on('shown.bs.modal', function () {
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
        case 2://assign
            num = parseFloat($('#login_form_argv').val());
            $('#stdout').html(num);
            break;
        case 3://pixiv
            url = "https://www.pixiv.net/artworks/" + $('#login_form_argv').val();
            window.open(url);
            break;
        case 4://system
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