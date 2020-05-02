
//game tracking
let undoneMoves = [];
function showPrevMove(){
  if (!canAnimate || displaySimulateIndex !== 0 ){ return }
  let prevMove = moveHistory.pop();
  if (prevMove) {
    canAnimate = false;
    if (prevMove.promotion){ 
      //want to undo promotion by the piece not the square because the state isnt updated during movehistory naviagation 
//       undoPromotion(boards[0].state[prevMove.move[1][0]][prevMove.move[1][1]])
      undoPromotion(pieceMap.get(Array.from(boardNode.children[prevMove.move[1][0]].children[prevMove.move[1][1]].children).find(piece=>piece.classList.contains("piece"))))
    }
    if (prevMove.capture){
      completeMoveFromState([prevMove.move[1],prevMove.move[0]],false).then(()=>{
        let startParent = prevMove.capture.piece.parentElement;
        let p = prevMove.capture.piece;
        let sq = boardNode.children[prevMove.move[1][0]].children[prevMove.move[1][1]];
        pieceMap.get(p).isCaptured = false;
        prevMove.capture = startParent;
        if (prevMove.enPassant){
          sq = boardNode.children[prevMove.enPassant[0]].children[[prevMove.enPassant[1]]];
        }
        completeMove(startParent,p,sq,false).then(()=>{
          canAnimate = true;
        });
      });
    } else if (prevMove.castle){
      Promise.all(
        [completeMoveFromState([prevMove.move[1],prevMove.move[0]],false),
         completeMoveFromState([prevMove.castle[1],prevMove.castle[0]],false)]).then(()=>{
           canAnimate = true;
        });
    } else {
      completeMoveFromState([prevMove.move[1],prevMove.move[0]],false).then(()=>{
        canAnimate = true;
      });
    }
    undoneMoves.push(prevMove);
    //console.log (moveHistory,undoneMoves);
  }
}

function showNextMove(){
  if (!canAnimate || displaySimulateIndex !== 0 ){ return }
  let nextMove = undoneMoves.pop();
  if (nextMove) { 
    canAnimate = false;
    if (nextMove.promotion){ 
      promotePiece(nextMove.move[0],nextMove.promotion)
    }
    if (nextMove.capture){
      completeMoveFromState(nextMove.move,false).then(()=>{
        let graveyard = nextMove.capture;
        let startParent = boardNode.children[nextMove.move[1][0]].children[nextMove.move[1][1]];
        if (nextMove.enPassant){
          startParent = boardNode.children[nextMove.enPassant[0]].children[nextMove.enPassant[1]];
        }
        let piece = Array.from(startParent.children).find(piece=>piece.classList.contains("piece"));
        pieceMap.get(piece).isCaptured = true;
        nextMove.capture = pieceMap.get(piece);
        completeMove(startParent,piece,graveyard,false).then(()=>{
          canAnimate = true;
          if (undoneMoves.length === 0){ pickUpFromCurrentPosition()}
        });
      });
    } else if (nextMove.castle){
      Promise.all(
      [completeMoveFromState(nextMove.move,false),
       completeMoveFromState(nextMove.castle,false)]).then(()=>{
        canAnimate = true;
        if (undoneMoves.length === 0){ pickUpFromCurrentPosition()}

      });
    } else {
      completeMoveFromState(nextMove.move,false).then(()=>{
        canAnimate = true;
        if (undoneMoves.length === 0){ pickUpFromCurrentPosition()}
      });
    }
    moveHistory.push(nextMove);
  }
}
