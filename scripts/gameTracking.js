
//game tracking
let undoneMoves = [];
function showPrevMove(){
  if (!canAnimate || displaySimulateIndex !== 0 ){ return }
  let prevMove = moveHistory.pop();
  if (prevMove) {
    canAnimate = false;  
    if (prevMove.capture){
      completeMoveFromState([prevMove.move[1],prevMove.move[0]],false).then(()=>{
        let startParent = prevMove.capture.piece.parentElement;
        let p = prevMove.capture.piece;
        let sq = boardNode.children[prevMove.move[1][0]].children[prevMove.move[1][1]];
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
  let nextMove = undoneMoves[undoneMoves.length-1];
  if (nextMove) { 
    canAnimate = false;
    if (nextMove.capture){
      completeMoveFromState(nextMove.move,false).then(()=>{
        let graveyard = nextMove.capture;
        let startParent = boardNode.children[nextMove.move[1][0]].children[nextMove.move[1][1]];
        if (nextMove.enPassant){
          startParent = boardNode.children[nextMove.enPassant[0]].children[nextMove.enPassant[1]];
        }
        let piece = startParent.children[1];
        nextMove.capture = pieceMap.get(piece);
        completeMove(startParent,piece,graveyard,false).then(()=>{
          canAnimate = true;
        });
      });
    } else if (nextMove.castle){
      Promise.all(
      [completeMoveFromState(nextMove.move,false),
       completeMoveFromState(nextMove.castle,false)]).then(()=>{
        canAnimate = true;
      });
    } else {
      completeMoveFromState(nextMove.move,false).then(()=>{
        canAnimate = true;
      });
    }
    moveHistory.push(nextMove);
    undoneMoves.pop();
    //console.log (moveHistory,undoneMoves);
  }
}
