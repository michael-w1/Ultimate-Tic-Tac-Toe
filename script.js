
let playerSymbol = "";
let opponentSymbol = "";
let turn = "";
let isTurn = true;
let opponent = "";
let oMove = 10;  // last move made by opponent 

$(document).ready(function () {
    let socket = io();
    console.log(document.cookie);
    // At this point should have cookie ..... 
    socket.emit('getSymbol', getCookie("roomID"), getCookie("uname"));
    socket.emit('getOppName', getCookie("roomID"), getCookie("uname"));
    socket.emit('getTurn', getCookie("roomID"), getCookie("uname"));


    // Fetch Theme Request -- send it to do stuff 

    

    let name = getCookie("uname");
    socket.on("getSymbol", function (symbol) {
        console.log("in get symbol", symbol);
        playerSymbol = symbol;
        if (symbol === "X") {
            opponentSymbol = "O";
        } else {
            opponentSymbol = "X"
        }
        // need to get the cookies

    });

    let theme = getCookie("theme");
    if (theme === ""){
        // assign default theme
        document.cookie = "theme" + " = " + "normal" + ";";

    }


    theme = getCookie("theme");
    
    if (theme === "normal") {
        $(".jumbotron").css("background-color", "white");

    } else if (theme === "dark") {
        $(".jumbotron").css("background-color", "lightgray");

    }
    else {
        $(".jumbotron").css("background-color", "lightblue");

    }


    socket.on('getOppName', function (opponentName) {
        opponent = opponentName;
        $("#mainText").text(getCookie("uname") + ", you are playing " + opponentName);

    });


    $(".block:empty").hover(function(){
        if(oMove === 10){
            $(this).html(playerSymbol);}
        else{
            if(parseInt($(this).parent().parent().parent().parent().attr('class').slice(-1)) === oMove){
                $(this).html(playerSymbol); 

            } 


        }
        }, function(){
        $(this).html("");
      });




    socket.on("opponentMoves", function (code, boardNum, row, position, mainBoard, user) {

        if (getCookie("uname") === user && getCookie("roomID") === code) {
            // use the code to set the cookie
            boardClass = ".board" + boardNum;
            console.log("what is happening at opponent moves here");

            // placement.html("O"); 
            block = ".b" + position;  // yes,
            console.log($(boardClass).find(block));

            // 
            $(boardClass).find(block).html(opponentSymbol);

            //position 
            // Convert position number from 1 to 9 to 2d array indices 
            let indice1 = 0;
            if (position >= 1 && position <= 3) {
                indice1 = 0;
            } else if (position <= 6) {
                indice1 = 1;
            } else {
                indice1 = 2;
            }


            if (mainBoard[indice1][(position - 1) % 3] !== "") {
                oMove = 10;
            } else {
                oMove = position;

            }
        }

    });

    $(".block").on('click', function () {
        console.log("on click for block - playerSymbol", playerSymbol);
        console.log("At begining of block,", $(".block").prop('disabled'), "symbol", playerSymbol, "isTurn", isTurn);
        if (isTurn === true) {

            // if ($('.block').text() == ""){
            $(".block:empty").prop('disabled', false); 


            $(this).html(playerSymbol);
            placePiece($(this), playerSymbol);
            socket.emit('getTurn', getCookie("roomID"), getCookie("uname"));
            colorAllSubtables("black");

            // }
        } else {
            //$(".block").prop('disabled', true);
            // $("#play").prop('disabled', true);
        }

        //socket.emit('getTurn', getCookie("roomID"), getCookie("uname"));


        // $(this).html(playerSymbol);
        // placePiece($(this), playerSymbol);


        // if (turn & 1) {
        //     $(this).html(playerSymbol);
        //     // let sName = $(this).parent().parent().attr('class');
        //     // $(this).html(sName);
        //     // console.log(sName);
        //     placePiece($(this), playerSymbol);
        // } else {
        //     $(this).html(opponentSymbol);
        //     // let sName = $(this).parent().parent().attr('class');
        //     // $(this).html(sName);
        //     // console.log(sName);
        //     placePiece($(this), opponentSymbol);

        // }

       // turn += 1;


    });


    socket.on("getTurn", function (Turn, id, uname) {
        // since roomID and name together is unique idenifier, stops broadcasting to wrong user
        console.log("Inside get turn", id, uname);
        if (getCookie("uname") === uname && getCookie("roomID") === id) {
            if (Turn === true) {
                isTurn = true;
                $("#subText").text(uname + ", it is your turn");

                if (oMove === 10) {
                    $(".block:empty").prop('disabled', false);
                    colorAllSubtables("green");
                }
                else {
                    $(".board" + oMove).find(".block:empty").prop('disabled', false);
                    colorSubtable(oMove, "green");

                }



            }
            else {
                isTurn = false;
                $("#subText").text("Please wait for " + opponent + "'s turn");
                $(".block").prop('disabled', true);
            }

        }






    });


    socket.on("endGameMsg", function (msg, rID) {
        if (document.getCookie("roomID") === rID) {
            $("#mainText").text(msg);
            $(".block").prop('disabled', true);
        }


    });


    $("#darkTheme").on('click', function () {
        $(".jumbotron").css("background-color", "lightgray");
        // Want to show the table colors too 
        // set the cookies and ... make such that etc. 
        document.cookie = "theme" + " = " + "dark" + ";";
        console.log(document.cookie);
        // $("table").css("border", "3px solid red"); 
        // $("table .board1").css("border-collapse", "collapse"); 
        // $("table .board1 td").css("border", "3px solid red"); 

        // $("table .board1 tr:first-child td").css("border-top", "0"); 
        // $("table .board1 tr td:first-child").css("border-left", "0"); 

        // $("table .board1 tr:last-child td").css("border-bottom", "0"); 
        // $("table .board1 tr td:last-child").css("border-right", "0"); 
        //colorSubtable(1, "green");





    });




    $("#normalTheme").on('click', function () {
        $(".jumbotron").css("background-color", "white");
        document.cookie = "theme" + " = " + "normal" + ";";
        console.log(document.cookie);
        //colorAllSubtables("blue");
    });


    $("#blueTheme").on('click', function () {
        $(".jumbotron").css("background-color", "lightblue");
        document.cookie = "theme" + " = " + "blue" + ";";
        console.log(document.cookie);
        // $(".board" + "9" ).find(".block").prop('disabled', false);
        // colorSubtable(9,"pink"); 


    });



    function colorSubtable(number, color) {
        let target = ".board" + number;
        $("table " + target).css("border-collapse", "collapse");
        $("table " + target + " td").css("border", "3px solid " + color);

        $("table " + target + " tr:first-child td").css("border-top", "0");
        $("table " + target + " tr td:first-child").css("border-left", "0");

        $("table " + target + " tr:last-child td").css("border-bottom", "0");
        $("table " + target + " tr td:last-child").css("border-right", "0");

    }

    function colorAllSubtables(color) {


        for (let i = 1; i <= 9; i++) {
            $("table " + ".board" + i).css("border-collapse", "collapse");
            $("table " + ".board" + i + " td").css("border", "3px solid " + color);

            $("table " + ".board" + i + " tr:first-child td").css("border-top", "0");
            $("table " + ".board" + i + " tr td:first-child").css("border-left", "0");

            $("table " + ".board" + i + " tr:last-child td").css("border-bottom", "0");
            $("table " + ".board" + i + " tr td:last-child").css("border-right", "0");

        }


    }










    // There are 9 sub-boards
    // The indices for each board:
    // [1,2,3
    //  4,5,6
    //  7,8,9]
    function placePiece(placement, piece) {
        // let boardNum = placement.parent().parent().attr('class').slice(-1);
        // placement = $(this) for ($.block)

        // Accessing the table class: <table class = ... board number > <tbody> <tr> <td> <button class = "block" ... > ....
        let boardNum = placement.parent().parent().parent().parent().attr('class').slice(-1);
        console.log("BOARD NUMBER", boardNum);
        let index = Number(placement.val());
        console.log(boardNum);
        console.log(index);
        let row = 0;
        if (index >= 1 && index <= 3) {
            row = 0;
        } else if (index <= 6) {
            row = 1;
        } else {
            row = 2;
        }


        // console.log(boardNum - 1, row, (index - 1) % 3); 
        //board[boardNum - 1][row][(index - 1) % 3] = piece;

        placement.prop('disabled', true);
        placement.css('background', 'SteelBlue');
        // (code, boardNum, x, y, userName)
        socket.emit('setPiece', getCookie("roomID"), boardNum, row, index, getCookie("uname"), placement);

        //board = "wumbo"; 
        //console.log(piece); 
        //console.log(board); 
        // console.log("local winner", board[boardNum - 1]);
        // if (getWinner(board[boardNum - 1], row, (index - 1) % 3, piece) === false) {
        //     $("#title").text("Game in progress here");

        // } else {
        //     $("#title").text("Winner is: " + piece);
        //     console.log("THING", parseInt((boardNum - 1) / 3), (boardNum - 1) % 3);
        //     mainBoard[parseInt((boardNum - 1) / 3)][(boardNum - 1) % 3] = piece;
        //     console.log(mainBoard);

        //     // to-do disable all pieces here - some change to board to indicate winner 

        //     if (!getWinner(mainBoard, parseInt((boardNum - 1) / 3), (boardNum - 1) % 3, piece)) {
        //         $("#message").text("END Game in progress");

        //     } else {
        //         $("#message").text("END GAME: " + piece + "WINNER");

        //     }
        // }




    }


    function getCookie(uname) {
        // Reference: https://www.w3schools.com/js/js_cookies.asp 
        // How to get a cookie in javascript 

        let find = uname + "=";
        // var decodedCookie = decodeURIComponent(document.cookie);
        let data = document.cookie.split(';');
        for (let i = 0; i < data.length; i++) {
            var cookieItem = data[i];
            while (cookieItem.charAt(0) == ' ') {
                cookieItem = cookieItem.substring(1);
            }
            if (cookieItem.indexOf(find) == 0) {
                return cookieItem.substring(find.length, cookieItem.length);
            }
        }


        return "";
    }






});















