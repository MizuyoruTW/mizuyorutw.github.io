var num = 0;
const commands = ["RAS", "ECHO", "PIXIV", "SYSTEM"];

function focus_card(jname) {
    $(".card").not(jname).css("z-index", "auto");
    $(jname).css("z-index", "999");
    $(jname).children('.card-header').addClass("bg-primary");
    $(".card").not(jname).children('.card-header').removeClass("bg-primary");
}

$(document).ready(function () {
    // device detection
    if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent)
        || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0, 4))) {
        window.location.replace("./mobile.html");
    }
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

    //check connection
    setInterval(function () {
        $.ajax({
            url: "./connection.json" + Date.now().toString(),
            dataType: 'json',
            error: function () {
                if (!$('#conn_err').length) {
                    var toaststr = '<div id="conn_err" class="toast" role="alert" aria-live="assertive" aria-atomic="true" data-autohide="false">\
                                    <div class="toast-header bg-primary">\
                                        <strong class="mr-auto text-white">Connection Error</strong>\
                                        <button type="button" class="ml-2 mb-1 close" data-dismiss="toast" aria-label="Close">\
                                        <span aria-hidden="true">&times;</span>\
                                        </button>\
                                    </div>\
                                    <div class="toast-body text-muted bg-white">\
                                        連線至伺服器錯誤\
                                    </div>\
                                </div>';
                    $('#toast_area').append(toaststr);
                }
                $('#conn_err').toast('show');
                $('#conn_bar').removeClass("progress-bar-animated");
                $('#conn_bar').removeClass("bg-success");
                $('#conn_bar').addClass("bg-danger");
                $('#conn_bar').html("Disconnected");
                $('#conn_msg').html("連線至遠端伺服器失敗");
            },
            success: function () {
                $('#conn_bar').addClass("progress-bar-animated");
                $('#conn_bar').addClass("bg-success");
                $('#conn_bar').removeClass("bg-danger");
                $('#conn_bar').html("Connected");
                $('#conn_msg').html("已連線至遠端伺服器");
                $('#conn_send').html((parseInt($('#conn_send').html()) + Math.floor(Math.random() * 10240)).toString());
                $('#conn_recv').html((parseInt($('#conn_recv').html()) + Math.floor(Math.random() * 10240)).toString());
            },
            timeout: 3000
        });
    }, 5000);
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