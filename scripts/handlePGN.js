function algebraicNotation(){
  let colNotation = 'abcdefgh'.split('');
  let pieceShorthand, move, moveNotation;
  let notationLog = []

  for (let i=0;i<moveHistory.length;i+=2){
    moveNotation = ''
    for (let j=0;j<2;j++){
      move = moveHistory[i+j].move;
      //get letter of piece 
      if(move[2] === "Pawn") {
        pieceShorthand = '';
      } else if (move[2] === "Knight"){
        pieceShorthand = 'N'
      } else {
        pieceShorthand = move[2][0];  
      }
      //check if another piece can move there 
      if (moveHistory[i+j].double === 'column'){
        pieceShorthand += colNotation[move[0][1]];
      } else if (moveHistory[i+j].double === 'row'){
        pieceShorthand += String(8-move[0][0]);
      }

      //check if the move was a castle 
      if (moveHistory[i+j].castle){
        if (Math.abs(moveHistory[i+j].castle[1][1] - moveHistory[i+j].castle[0][1]) === 2){
             moveNotation += 'O-O';
        } else { 
             moveNotation += 'O-O-O';
        }
      } else if (moveHistory[i+j].capture) { //check if the move was a capture  
        if (pieceShorthand === '') {
          pieceShorthand = colNotation[move[0][1]];
          if (moveHistory[i+j].enPassant) {
            //debugger
          }
        }
        moveNotation += pieceShorthand + 'x' + colNotation[move[1][1]] +String(8-move[1][0]);
      } else {
        moveNotation += pieceShorthand+colNotation[move[1][1]]+String(8-move[1][0]);
      }

      if (moveHistory[i+j].promotion){
        moveNotation += '=' +  moveHistory[i+j].promotion;
      }

      // check if the move was a check or checkmate 
      if (moveHistory[i+j].check){ 
        if (moveHistory[i+j].checkmate) {
          moveNotation += '#' 
        } else {
          moveNotation += '+' 
        } 
      }
      //if white moved last 
      if (i+1 >= moveHistory.length){
        break
      }
      if (j === 0){moveNotation+= ' '}
    }
    notationLog.push(+ String(i/2+1)+'. '+ moveNotation)
  }
  return notationLog;
}






function readPGN(){
  //idea was to move each move 1 at a time. but what if they want to import and click through
  //what if they want to jump to a spot, or animate the game and change speeds. 
  //all options could be done by building moveHistory or undone moves
  return new Promise((resolve,reject)=>{
    playingComputer = false;
  //   let pgnData = '1. Nf3 Nf6,2. Ne5 d6,3. Nxf7 Kxf7,4. e3 Nc6,5. Qh5+ Nxh5,6. f4 Nf6,7. h4 h6,8. h5 g5,9. hxg6+ Ke6,10. g7 Ng4,11. d3 Kf6,12. gxh8=Q+ Bg7,13. Qxd8 Nxd8'.split(',')
  //   let pgnData = '1. Nf3 Nc6,2. g3 d6,3. Bg2 Be6,4. O-O Qd7,5. Nc3 O-O-O,6. h4'.split(',');
    if (pgnText.value === "") {
      return
    }
    let cleanedPGN = pgnText.value.replace(/[\n\r]/g, '').replace(/,/g,'');
    let pgnData = cleanedPGN.split(/(\d+\.)/).filter(x=>!/(^\d+\.)/.test(x) && x !== '').map(x=>x.trim())
    let p1Color = whoWentFirst(pgnData[0].split(' ')[0]);
    if (p1Color !== firstMove){
      doToggleFirst().then(checkEachMove)
    } else {
      checkEachMove();  
    }
    async function checkEachMove(){
      let PGNboard = {}
      PGNboard.state = createSimulatedBoard(boards[0].state)
      boards.push(PGNboard)
      for (const twoMoves of pgnData){
        await findAndMakeMoves(twoMoves, PGNboard, p1Color);
      }
      boards.pop()
      console.log('complete');
      resolve();
    }
  });

  function createSimulatedBoard(board){
    let nextBoard = board.map(a=> Object.assign([],a)); //creates a board with all copied pieces 
    nextBoard.forEach((row,i)=>{
      row.forEach((square,j)=>{
        if (square){
          let clone = Object.assign( Object.create(Object.getPrototypeOf(square)), square);
          clone.rowCol = [...clone.rowCol]
          clone.action = JSON.parse(JSON.stringify(clone.action))
          nextBoard[i][j] = clone;
        }
      })
    });
    return nextBoard
  }

  function whoWentFirst(move){
    let row = move[move.length-1]
    return (row ==='3' || row === '4')
  }
}

async function findAndMakeMoves(twoMoves, PGNboard, turn){
  let moves = twoMoves.split(' ');
  let p1Color = turn;
  for (let move of moves) { 
    if (move === 'Rfe1'){
      debugger
    }
    let piecesOnBoard = getPiecesOnBoard(PGNboard);
    changePieceBoardID(piecesOnBoard,1)
    //breakdown
    let breakdown = breakdownMove(move,turn);
    breakdown.piece = getPieceName(move[0]);

    getMovesWithoutRating(piecesOnBoard);

    let piece = findMovingPiece(breakdown, turn, piecesOnBoard);

    breakdown.from = piece.rowCol 
    
    if (breakdown.capture){
      checkEnPassant(breakdown);  
    }


    simulateMove(breakdown, PGNboard.state)
    
    addMoveHistory(breakdown);


    //change for next move
    turn = !turn;
  }

  function simulateMove(breakdown, board){
    let to = breakdown.to;
    let from = breakdown.from;
    let promotion = breakdown.promotion;
    let castle = breakdown.castle;
    let enPassant = breakdown.enPassant;

    let piece =board[from[0]][from[1]];
    board[to[0]][to[1]] = piece;
    board[from[0]][from[1]] = null;

    if (promotion){
      let newPieceType = getPieceNameFromLetter(promotion);
      let promotedPiece = createPromotedPiece(newPieceType,null);
      board[to[0]][to[1]] = promotedPiece;
      promotedPiece.promoted = true;
      promotedPiece.color = piece.color;
      piece = promotedPiece;
    } else if (castle){
      board[castle[1][0]][castle[1][1]] = board[castle[0][0]][castle[0][1]]
      board[castle[1][0]][castle[1][1]].rowCol = castle[1]
      board[castle[1][0]][castle[1][1]].hasMoved = true;
      board[castle[0][0]][castle[0][1]] = null;
    } else if (enPassant) {
      board[enPassant[0]][enPassant[1]] = null;
    }

    piece.hasMoved = true;
    piece.rowCol = to;
  }

  function addMoveHistory(breakdown){
    moveHistory.push({move:[breakdown.from,breakdown.to,breakdown.piece],
    capture:breakdown.capture,castle:breakdown.castle,promotion:breakdown.promotion,
    enPassant:breakdown.enPassant})
    //debugger
  }

  function changePieceBoardID(piecesOnBoard,boardIndex){
    piecesOnBoard[true].forEach(piece=>{
      piece.boardID = boardIndex;
    })
    piecesOnBoard[false].forEach(piece=>{
      piece.boardID = boardIndex;
    })
  }

  function checkEnPassant(breakdown){
    if (PGNboard.state[breakdown.to[0]][breakdown.to[1]] === null){
      if (turn){
        breakdown.enPassant = [breakdown.to[0]+1,breakdown.to[1]]
      } else {
        breakdown.enPassant = [breakdown.to[0]-1,breakdown.to[1]]
      }
    }
  }

  function findMovingPiece(breakdown, turn, piecesOnBoard){
    let moveablePieces = piecesOnBoard[turn].filter(piece=>piece.constructor.name === breakdown.piece); 
    let pieceToMove,piece,possiblePiece;
    let possiblePieces = [];
    for (let i=0;i<moveablePieces.length;i++){
      piece = moveablePieces[i];
      if (breakdown.capture){
        possiblePiece = piece.action.legal.captures.find(move=> move[0] === breakdown.to[0] && move[1] === breakdown.to[1] );
      } else {
        possiblePiece = piece.action.legal.moves.find(move=> move[0] === breakdown.to[0] && move[1] === breakdown.to[1] );
      }
      if (breakdown.castle){
        return piece
      }
      if (possiblePiece) {
        possiblePieces.push(piece)  
      }
    }
    if (possiblePieces.length === 1 ){
      return possiblePieces[0]
    } else if (possiblePieces.length == 2) {
      if (breakdown.double) {
//         debugger
        let col = 'abcdefgh'.indexOf(breakdown.double)
        if (col > -1){
          return possiblePieces.find(x=>x.rowCol[1] === col)
        } else {
          return possiblePieces.find(x=>x.rowCol[0] === 8 - breakdown.double)
        }
      } else {
        debugger //double error somewhere
      }
    }
    if (!pieceToMove){debugger}
  }

  function breakdownMove(move,turn){
    let len;
    let breakdown = {};

    breakdown.capture = move.indexOf('x') !== -1;
    breakdown.promotion = move.indexOf('=') !== -1;
    breakdown.castle = move.indexOf('O-O') !== -1;
    breakdown.check =  move.indexOf('+') !== -1;
    breakdown.checkmate =  move.indexOf('#') !== -1;

    if (breakdown.capture) { 
      move =  move.replace('x','') 
      if (turn) { breakdown.capture = p2graveyard; } 
      else { breakdown.capture = p1graveyard; }
    }
    if (breakdown.check) { move = move.replace('+','') }
    if (breakdown.checkmate) { move = move.replace('#','') }

    if (breakdown.castle){
      if (move === "O-O"){
        if (p1Color){
          if (turn){
            breakdown.to = [7,6];
            breakdown.castle = [[7,7],[7,5]];
          } else {
            breakdown.to = [0,6];
            breakdown.castle = [[0,7],[0,5]];
          } 
        } else {
          if (turn){
            breakdown.to = [7,1];
            breakdown.castle = [[7,0],[7,2]];
          } else {
            breakdown.to = [0,1];
            breakdown.castle = [[0,0],[0,2]];
          } 
        }
      } else {
        if (p1Color){
          if (turn){
            breakdown.to = [7,2];
            breakdown.castle = [[7,0],[7,3]];
          } else {
            breakdown.to = [0,2]
            breakdown.castle = [[0,0],[0,3]];
          }
        } else {
          if (turn){
            breakdown.to = [7,5];
            breakdown.castle = [[7,7],[7,4]];
          } else {
            breakdown.to = [0,5]
            breakdown.castle = [[0,7],[0,4]];
          }
        }
      }
      return breakdown

    }

    if (breakdown.promotion) { 
      breakdown.promotion = move[move.indexOf('=')+1];
      move = move.split('=')[0]; 
    }

    len = move.length;
    if (len === 2){
      breakdown.piece = 'Pawn';
      breakdown.to = pgnToRowCol(move);
    } else {
      breakdown.piece = move[0];
      if (len === 3) {
        breakdown.to = pgnToRowCol(move.substring(1));
      } else if (len === 4){
          if ('abcdefg'.indexOf(move.substring(1,2)) === -1 ) {
            breakdown.double = move.substring(1,2);
          } else {
            breakdown.double = move.substring(1,2);
          }
          breakdown.to = pgnToRowCol(move.substring(2));
      } else {
        debugger
      }
    }
    return breakdown
  }
}
function pgnToRowCol(move){
  let colNotation = 'abcdefgh'.split('');
  let col = colNotation.indexOf(move[0]);
  let row = 8-move[1];
  return [row,col]
}

function getMovesWithoutRating(piecesOnBoard){
  clearAllLegalMoves(piecesOnBoard);
  getAllLegalMoves(piecesOnBoard);
}

function getPieceName(firstChar){
  if (firstChar === 'O'){
    return 'King'
  }else if ('KQRBNP'.indexOf(firstChar) === -1){
    return 'Pawn'
  } else if (firstChar === 'K') {
    return 'King'
  } else if (firstChar === 'Q') {
    return 'Queen'
  } else if (firstChar === 'R') {
    return 'Rook'
  } else if (firstChar === 'B') {
    return 'Bishop'
  } else if (firstChar === 'N') {
    return 'Knight'
  }
}

function setPGN(){
  undoneMoves = moveHistory.reverse();
  moveHistory = [];
}
    