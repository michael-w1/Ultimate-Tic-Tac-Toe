var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/main.html');
});


app.get('/index.html', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/style.css', function (req, res) {
  res.sendFile(__dirname + '/style.css');
});


app.get('/script.js', function (req, res) {
  res.sendFile(__dirname + '/script.js');
});




// List of JS objects of current game rooms 
// Push 
let rooms = [];

let queue = [];


io.on('connection', function (socket) {

  // console.log("other");

  socket.on('createCode', function () {
    let code = "";
    for (let i = 0; i < 9; i++) {
      // Create random integer from 0 to 9 (Inclusive on 0 and 9)
      code += Math.floor(Math.random() * 10);
    }
    console.log(code);

    // check that code is unique and not already in use ? 


    //code = "1"; // for testing purposes 
    socket.emit('createCode', code);

  });


  socket.on('play', function (userName, code) {
    console.log(userName, code);

    boards = newGame();
    playerSymbols = getSymbol(); // returns array of ["X","O"] or ["O","X"] randomly 
    rooms.push({ roomID: code, mainBoard: boards[0], subBoards: boards[1], turn: 0, player1: userName, p1Symbol: playerSymbols[0], p2Symbol: playerSymbols[1] });

    console.log(rooms);
  });


  socket.on('createRandomGame', function (userName, code) {
    console.log(userName, code);
    if (queue.length === 0) {
      boards = newGame();
      playerSymbols = getSymbol(); // returns array of ["X","O"] or ["O","X"] randomly 
      queue.push({ roomID: code, mainBoard: boards[0], subBoards: boards[1], turn: 0, player1: userName, p1Symbol: playerSymbols[0], p2Symbol: playerSymbols[1] });

    } else {

      // Remove the room etc. 
      room = queue.pop();
      socket.emit('getID', room.roomID);
      if(userName === room.player1){
        userName = userName + "1";
        socket.emit('newName', userName); 
      }

      room.player2 = userName;
      rooms.push(room);
      socket.emit('loadGame');
      socket.broadcast.emit('initLoad');

    }


    //console.log(rooms);
  });

  socket.on('getSymbol', function (id, name) {
    let i = getRoomIndex(id);
    if (i === -1) {
      console.log("Error finding symbols");
    }
    else {
      console.log("server side, getting symbols", rooms[i].p1Symbol, rooms[i].p2Symbol);
      console.log(rooms[i]);
      if (rooms[i].player1 === name) {
        socket.emit('getSymbol', rooms[i].p1Symbol);
      } else {
        socket.emit('getSymbol', rooms[i].p2Symbol);
      }



    }


  });








  socket.on('submitCode', function (player2, code) {
    let index = -1;
    for (let i = 0; i < rooms.length; i++) {
      if (rooms[i].roomID === code) {
        index = i;
        break;
      }
    }

    if (index === -1) {
      socket.emit('errorCode');

    } else {

      if (rooms[index].hasOwnProperty('player2')) {
        console.log("Room is full already");
        socket.emit('errorCode');
        // Say the error code is incorrect 
      } else {
        // Edit username if its the same
        if (player2 === rooms[index].player1){
          player2 = player2 + "1"; 
          socket.emit('newName', userName); 
        }

        rooms[index].player2 = player2;
        //res.sendFile(__dirname + '/index.html');
        console.log("before the redirect");
        socket.emit('loadGame');
        socket.broadcast.emit('initLoad');
      }
    }




  });

  socket.on('cool', function (code) {
    let index = -1;
    for (let i = 0; i < rooms.length; i++) {
      if (rooms[i].roomID === code && rooms[i].hasOwnProperty('player2')) {
        index = i;
        break;
      }
    }

    if (index === -1) {
      //socket.emit('errorCode');
      console.log("error connecting to room")

    } else {
      // rooms[index].player2 = player2; 
      //res.sendFile(__dirname + '/index.html');
      console.log("before the redirect for starter");
      socket.emit('loadGame');
      //socket.broadcast.emit('initLoad'); 
    }


  });


  socket.on('getTurn', function (id, name) {
    let i = getRoomIndex(id);
    if (i === -1) {
      console.log("error in getting turn from roomID");
    } else {
      if (rooms[i].turn & 1) {
        // let player 2 go 
        if (name === rooms[i].player2) {
          // send response back to player 2
          socket.emit('getTurn', true, id, name);
          // send response back to all other nodes 
          console.log("if 1", name); 
          socket.broadcast.emit('getTurn', false, id, rooms[i].player1);
          //console.log("if 1"); 
        } else {

          socket.emit('getTurn', false, id, name);
          console.log("if 2", name); 
          socket.broadcast.emit('getTurn', true, id, rooms[i].player2);
          // gonna have to send ID to ensure that it is true and name???? 
          

        }


      } else {
        // let player 1 go 
        if (name === rooms[i].player1) {
          socket.emit('getTurn', true, id, name);
          console.log("if 3", name); 
          socket.broadcast.emit('getTurn', false, id, rooms[i].player2 );
        } else {
          socket.emit('getTurn', false, id, name);
          console.log("if 4", name); 
          socket.broadcast.emit('getTurn', true, id, rooms[i].player1);
        }

      }
    }

  });


  socket.on('getOppName', function (id, name) {
    let i = getRoomIndex(id);
    if (i === -1) {
      console.log("Error in getting opponent name");
    } else {
      if (rooms[i].player1 === name) {
        socket.emit('getOppName', rooms[i].player2);
      } else {
        socket.emit('getOppName', rooms[i].player1);
      }
    }

  });


  socket.on('setPiece', function (code, boardNum, x, y, userName, placement) {
    console.log("inside the set piece function");

    let roomIndex = getRoomIndex(code);
    if (roomIndex === -1) {
      console.log("error connecting to room")

    } else {

      console.log(rooms[roomIndex]);
      let piece = "";
      if (rooms[roomIndex].player1 === userName) {
        piece = rooms[roomIndex].p1Symbol;
      } else {
        piece = rooms[roomIndex].p2Symbol;
      }

      // Assigning piece to boards on server 

      rooms[roomIndex].subBoards[boardNum - 1][x][(y - 1) % 3] = piece;
      console.dir(rooms[roomIndex].subBoards);
      rooms[roomIndex].turn += 1;
      console.log("end of board, turn = ", rooms[roomIndex].turn);
      let receiver = userName;
      if(userName === rooms[roomIndex].player1 ){
        receiver = rooms[roomIndex].player2;  

      }else{
        // player2 is the requester 
        receiver = rooms[roomIndex].player1;  

      }

      socket.broadcast.emit("opponentMoves", code, boardNum, x, y, rooms[roomIndex].mainBoard, receiver); 


      if (getWinner(rooms[roomIndex].subBoards[boardNum - 1], x, (y - 1) % 3, piece) === false) {
        // $("#title").text("Game in progress here");

      } else {
        //$("#title").text("Winner is: " + piece);
        //console.log("THING", parseInt((boardNum - 1) / 3), (boardNum - 1) % 3);

        let mainboard = rooms[roomIndex].mainBoard;
        mainboard[parseInt((boardNum - 1) / 3)][(boardNum - 1) % 3] = piece;
        console.log(mainboard);
        



        // Add the check if draw thing here and --- to check if there is a winner mate 
        if (!getWinner(mainboard, parseInt((boardNum - 1) / 3), (boardNum - 1) % 3, piece) && isDraw(mainboard)) {
          // $("#message").text("END Game in progress");
          console.log("Should be DRAW");
          socket.emit("endGameMsg", "It is a draw",code);

        }

        if (getWinner(mainboard, parseInt((boardNum - 1) / 3), (boardNum - 1) % 3, piece)) {
          // $("#message").text("END GAME: " + piece + "WINNER");
          if (code === rooms[roomIndex].roomID) {
            console.log("mainBoard, winner is ", piece);
            socket.emit("endGameMsg", "The Winner is " + userName, code);
          }

        }

      }





    }

  });

  










});



function isDraw(subBoard) {


  for (let i = 0; i < subBoard.length; i++) {
    for (let k = 0; k < subBoard[0].length; k++) {
      // if there is non-empty space it is not a draw 
      if (subBoard[i][k] === "") {
        return false;
      }


    }
  }


  return true;
}



function getWinner(subBoard, row, index, piece) {
  //subBoard = board[boardNum - 1];
  //return true; 

  // Check for Horizontal Win 
  console.log(subBoard);
  console.log("hello");
  console.log(subBoard[row][0], subBoard[row][1], subBoard[row][2], piece);
  // console.log(subBoard[row][0] === subBoard[row][1] === subBoard[row][2] === piece);
  if (subBoard[row][0] === subBoard[row][1]
    && subBoard[row][1] === subBoard[row][2]
    && subBoard[row][2] === piece) {
    return true;

  }

  // Check for Vertical Win 
  if (subBoard[0][index] === subBoard[1][index] && subBoard[1][index] === subBoard[2][index]
    && subBoard[2][index] === piece) {
    return true;
  }


  // Check the two diagonals for a win
  if ((subBoard[0][0] === subBoard[1][1] && subBoard[1][1] === subBoard[2][2]
    && subBoard[2][2] === piece) || (subBoard[0][2] === subBoard[1][1]
      && subBoard[1][1] === subBoard[2][0] && subBoard[2][0] === piece)) {
    return true;

  }


  return false;


}


// Returns -1 if room index is not found 
function getRoomIndex(ID) {
  let index = -1;
  for (let i = 0; i < rooms.length; i++) {
    if (rooms[i].roomID === ID) {
      index = i;
      break;
    }
  }

  return index;

};


function getSymbol() {
  let random = Math.floor(Math.random() * 2) + 1;
  if (random === 1) {
    return ["X", "O"];
  }
  else {
    return ["O", "X"];
  }


}



function newGame() {
  let mainBoard = [
    ["", "", ""],
    ["", "", ""],
    ["", "", ""]
  ];

  let board = [
    [
      ["", "", ""],
      ["", "", ""],
      ["", "", ""]
    ],
    [
      ["", "", ""],
      ["", "", ""],
      ["", "", ""]
    ],
    [
      ["", "", ""],
      ["", "", ""],
      ["", "", ""]
    ],
    [
      ["", "", ""],
      ["", "", ""],
      ["", "", ""]
    ],
    [
      ["", "", ""],
      ["", "", ""],
      ["", "", ""]
    ],
    [
      ["", "", ""],
      ["", "", ""],
      ["", "", ""]
    ],
    [
      ["", "", ""],
      ["", "", ""],
      ["", "", ""]
    ],
    [
      ["", "", ""],
      ["", "", ""],
      ["", "", ""]
    ],
    [
      ["", "", ""],
      ["", "", ""],
      ["", "", ""]
    ]
  ];


  return [mainBoard, board]
}






http.listen(port, function () {
  console.log('listening on *:' + port);
}); 
