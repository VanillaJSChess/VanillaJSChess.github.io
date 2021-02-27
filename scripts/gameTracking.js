//game tracking
let undoneMoves = [];
let movesOwed = 0
async function showPrevMove(){
  if (moveHistory.length === 0){
    movesOwed = 0;
    holdingToPrevMove = false;
  }
  
  if (!canAnimate) {
    await waitXms(500);
    return
  }
  while (moveHistory.length !== 0 && movesOwed < 0){
    let prevMove = moveHistory.pop();
    if (moveHistory.length === 0){
        movesOwed = 0;
        holdingToPrevMove = false;
    }
    if (prevMove) {
      canAnimate = false; 
      if (prevMove.promotion){ 
        //get the first piece on the square in the prevmove 
        undoPromotion(pieceMap
          .get(Array.from(boardNode.children[prevMove.move[1][0]].children[prevMove.move[1][1]].children)
          .find(piece=>piece.classList.contains("piece"))))
      }
      if (prevMove.capture){
        await completeMoveFromState([prevMove.move[1],prevMove.move[0]],false)
        let startParent = prevMove.capture.piece.parentElement;
        let p = prevMove.capture.piece;
        let sq = boardNode.children[prevMove.move[1][0]].children[prevMove.move[1][1]];
        pieceMap.get(p).isCaptured = false;
        prevMove.capture = startParent;
        if (prevMove.enPassant){
          sq = boardNode.children[prevMove.enPassant[0]].children[[prevMove.enPassant[1]]];
        }
        await completeMove({startParent,piece:p,square:sq,shouldUpdate:false});
        canAnimate = true;
      } else if (prevMove.castle){
        await Promise.all(
          [completeMoveFromState([prevMove.move[1],prevMove.move[0]],false),
           completeMoveFromState([prevMove.castle[1],prevMove.castle[0]],false)])
         canAnimate = true;
      } else {
        await completeMoveFromState([prevMove.move[1],prevMove.move[0]],false)
        canAnimate = true;
      }
      if (!holdingToPrevMove) movesOwed += 1
      unstickCount = 0;
      undoneMoves.push(prevMove);
    }
  }
}

async function showNextMove(){
  if (undoneMoves.length === 0){
    movesOwed = 0;
    holdingToNextMove = false;
  }
  if (!canAnimate) {
    await waitXms(500);
    return
  }
  while (undoneMoves.length !== 0 && movesOwed > 0){
    let nextMove = undoneMoves.pop();
    if (undoneMoves.length === 0){
        movesOwed = 0;
        holdingToNextMove = false;
    }
    if (nextMove) { 
      canAnimate = false;
      if (nextMove.promotion){ 
        promotePiece(nextMove.move[0],nextMove.promotion)
      }
      if (nextMove.capture){
        await completeMoveFromState(nextMove.move,false)
        let graveyard = nextMove.capture;
        let startParent = boardNode.children[nextMove.move[1][0]].children[nextMove.move[1][1]];
        if (nextMove.enPassant){
          startParent = boardNode.children[nextMove.enPassant[0]].children[nextMove.enPassant[1]];
        }
        let piece = Array.from(startParent.children).find(piece=>piece.classList.contains("piece"));
        pieceMap.get(piece).isCaptured = true;
        nextMove.capture = pieceMap.get(piece);
        await completeMove({startParent,piece,square:graveyard,shouldUpdate:false})
        canAnimate = true;
        if (undoneMoves.length === 0){ pickUpFromCurrentPosition()}
      } else if (nextMove.castle){
        await Promise.all(
        [completeMoveFromState(nextMove.move,false),
         completeMoveFromState(nextMove.castle,false)])
        canAnimate = true;
        if (undoneMoves.length === 0){ pickUpFromCurrentPosition()}
      } else {
        await completeMoveFromState(nextMove.move,false)
        canAnimate = true;
        if (undoneMoves.length === 0){ pickUpFromCurrentPosition()}
      }
      if (!holdingToNextMove) movesOwed -= 1
      unstickCount = 0;
      moveHistory.push(nextMove);
    }
  }
}


function waitXms(x){
  return new Promise((resolve,reject)=>{
    setTimeout(resolve,x)
  })
}
