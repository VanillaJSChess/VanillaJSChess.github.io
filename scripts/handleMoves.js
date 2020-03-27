
//Legal moves 
function getAllLegalMoves(piecesOnBoard){
  //initalize so that this is a fresh start each call 
  let checkmate = false;
  let atLeastOneMove;
  let piecesWithCaptures = {true:[],false:[]}; 

  Object.values(piecesOnBoard).forEach(side=>{
    side.forEach(piece=>{
      piece.attackedBy = [];
      piece.defendedBy = [];
    })
  })


  loopThroughMoves(piecesOnBoard[!turn]) //get all the enemies moves first. must get all legal moves for rating the boardstate 
  piecesOnBoard[turn].forEach(piece=>{
    piece.clearPotentialMoves(); //get the potential moves fresh without any found during 
  })
  atLeastOneMove = false
  loopThroughMoves(piecesOnBoard[turn]) //now get all the turn players move 


  filterKingDefends(); 
  
  if(!atLeastOneMove && piecesWithCaptures[turn].length < 1){ //if the current player has no moves 
    //only note checkmate if it is on your turn. Maybe classify both checkmates
    if (getKing(piecesOnBoard[turn]).attackedBy.length > 0) { 
      checkmate = true; // if the turn player's king is being attacked 
    }
  }     
  return checkmate //function returns boolean for if the move results in checkmate or not
  
  function loopThroughMoves(pieces){
    pieces.forEach(piece=>{
      piece.getLegalMoves(piecesOnBoard,piecesWithCaptures[!piece.color]);
      classifyMoves(piece);
    }); 

    function classifyMoves(piece){
      //builds the pieces with captures array 
      //determines which pieces each piece is attacked by and defended by 
      if (piece.action.legal.moves.length > 0 ){
        atLeastOneMove = true;
      }
      if (piece.action.legal.captures.length > 0){
        piecesWithCaptures[piece.color].push(piece);
        piece.action.legal.captures.forEach(capture=>{
          let target = boards[piece.boardID].state[capture[0]][capture[1]];
          if (target !== null){ //for en passant which is handled elsewhere 
            target.attackedBy.push(piece.rowCol);
          }
        });
      }
      piece.action.legal.defends.forEach(defense=>{
        boards[piece.boardID].state[defense[0]][defense[1]].defendedBy.push(piece.rowCol)
      });
    }
  }

  function filterKingDefends(){
    //also needs to delete the defended by king if the king cant capture 
    //the king cant defend a piece that is attached twice 
    let kingDefends;
    let kings = piecesOnBoard[true].concat(piecesOnBoard[false]).filter(piece=>piece.isKing)
    kings.forEach(king=>{
      kingDefends = king.action.legal.defends;
      king.action.legal.defends = kingDefends.filter((defense)=>{
        return boards[king.boardID].state[defense[0]][defense[1]].attackedBy.length < 2
      });
    });
  }
  function getKing(pieces){
    return pieces.find(piece=>piece.isKing)
  }
}


function makeSimplifiedBoardstate(board){
  return board.map(row=>row.map(square=> square ? square.constructor.name : null))
}

function oldMovesOutNewMovesIn(boardIndex){
  let piecesOnBoard = getPiecesOnBoard(boards[boardIndex]);  //needs to repeat in case move is taken during simulation 

  clearAllLegalMoves(piecesOnBoard);
  let checkmateFound = getAllLegalMoves(piecesOnBoard);
  if (checkmateFound){return true} //if a checkmate is found, no need to rate boardstate as checkmate should be chosen or avoided 
  boards[boardIndex].rating = rateBoardstate(piecesOnBoard,boardIndex);
}

function clearAllLegalMoves(pieces){
  Object.values(pieces).forEach(side=>{
    side.forEach(piece=>{
      piece.clearLegalMoves();
    });
  });
}