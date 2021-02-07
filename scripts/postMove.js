let canAnimate = true
function completeMoveFromState(move,shouldUpdate=true){
  return new Promise((resolve,reject)=>{
    let startParent = boardNode.children[move[0][0]].children[move[0][1]];
    let square = boardNode.children[move[1][0]].children[move[1][1]];
    let piece = Array.from(startParent.children).find(child=>child.classList.contains('piece'))
    completeMove({startParent,piece,square,shouldUpdate,move,testingLine:false}).then(()=>{
      resolve();
    });
  });
}

function completeMove({
  startParent,
  piece,
  square,
  shouldUpdate=true,
  move=undefined,
  testingLine=false}){
  if (testingLine) checkCorrectLine(startParent,piece,square);
  handleSquareHighlightsMove(startParent,square);
  return new Promise((resolve,reject)=>{
    movePiece(piece, square).then(()=>{
      if (shouldUpdate){
        checkSpecialtyMove(move,swap=true);
      }
      resolve();
    });  
  });

  function checkSpecialtyMove(move,swap=true){
    let from,to,name;
    moveHistory.push({move:[]});
    if (piece.classList.contains('king')){
      let castleMove = checkForCastle(getRowCol(startParent),getRowCol(piece.parentElement));
      if (castleMove) {
        pieceMap.get(piece).hasCastled = true;
        [from,to,name] = getPGNInfo(startParent,pieceMap.get(piece),square,move)
        moveHistory[moveHistory.length-1].move = [from,to,name]
        moveHistory[moveHistory.length-1].castle = castleMove;
        if (!swap) return
          completeMoveFromState(castleMove,false).then(()=>{
          updateDisplayedBoardState(from,to,pieceMap.get(piece));
          updateDisplayedBoardState(castleMove[0],castleMove[1],boards[0].state[castleMove[0][0]][castleMove[0][1]]);
          if (testingLine) assignBorder(correctCastleLine,moveHistory[moveHistory.length-1]);
          swapTurn(0)
        });
        return   
      }
    } else if (piece.classList.contains('pawn')) {
      checkPromotion(piece);
      if (midPromotion) {
        [from,to,name] = getPGNInfo(startParent,pieceMap.get(piece),square,move);
        moveHistory[moveHistory.length-1].move = [from,to,name]
        isPieceCaptured(square,to,swap); 
        if (!swap) return 
        updateDisplayedBoardState(from,to,pieceMap.get(piece));
        if (playingComputer && !turn){
          promotionSelected(undefined,computerPromotion = true, forcePromote ='Q');
        }
        return 
      }
    }        
    [from,to,name] = getPGNInfo(startParent,pieceMap.get(piece),square,move)
    moveHistory[moveHistory.length-1].move = [from,to,name]
    isPieceCaptured(square,to,swap).then(()=>{
      if (swap) {
        updateDisplayedBoardState(from,to,pieceMap.get(piece));
        swapTurn(0);
      }
    });
    
    function checkPromotion(piece,to){
      let rowCol = getRowCol(square);
      let row = rowCol[0];
      if (row === 0 || row === 7) {
        promotion(isp1(piece));
      }
    }
  }
  
  function isPieceCaptured(square,to,swap){
    return new Promise((resolve,reject)=>{
      let capturedPiece;
      let toOccupant = boards[0].state[to[0]][to[1]];
      if (toOccupant && toOccupant.piece !== piece) {
        capturedPiece = toOccupant  
      }

      if (!capturedPiece && piece.classList.contains('pawn')){
        let direction = pieceMap.get(piece).direction;
        capturedPiece = boards[0].state[to[0]-direction][to[1]];
        if (capturedPiece && capturedPiece.piece !== piece){
          if (swap) boards[0].state[to[0]-direction][to[1]] = null;
          moveHistory[moveHistory.length-1].enPassant = [to[0]-direction,to[1]];
        }
      }

      if (capturedPiece && capturedPiece.piece !== piece) {
        moveHistory[moveHistory.length-1].capture = capturedPiece;
        capturedPiece.isCaptured = true;
        if (swap) stackPiece(capturedPiece.piece).then(resolve);
      } else {
        resolve();
      }
    });
  }

  function checkCorrectLine(startParent,piece,square){
      checkSpecialtyMove(null,swap=false);
      let lastMove = moveHistory[moveHistory.length-1];
      if (lastMove.move[2]==="King"){
        let noMoveCastle = checkForCastle(lastMove.move[0],lastMove.move[1]);
        moveHistory[moveHistory.length-1].castle = noMoveCastle; 
      }
      let algebraicMove = algebraicNotation([lastMove])[0].split(' ')[1];
      moveHistory.pop();
      let nextMove = bookMoves.pop();
      correctCastleLine = nextMove===algebraicMove
      console.log(nextMove,algebraicMove);
      assignBorder(correctCastleLine,lastMove);
  } 
}

let correctCastleLine;

function checkForCastle(from, to){
  let moveDist = to[1]-from[1];
  let move;
  if (Math.abs(moveDist) < 2){ return }
  else if (to[1] ===6){
    move = ([[to[0],to[1]+1],[to[0],to[1]-1]]);
    return move
  } else if (to[1] === 2 ){
    move = ([[to[0],to[1]-2],[to[0],to[1]+1]]);
    return move
  } else if (to[1] === 5){
    move = ([[to[0],to[1]+2],[to[0],to[1]-1]]);
    return move
  } else if (to[1] === 1 ){ 
    move = ([[to[0],to[1]-1],[to[0],to[1]+1]]);
    return move
  }
}

function updateDisplayedBoardState(from,to,piece){
  boards[0].state[from[0]][from[1]] = null;
  boards[0].state[to[0]][to[1]] = piece;
  piece.rowCol = [to[0],to[1]]
  piece.hasMoved = true;
  boards[0].rating = 0;
}

function getPGNInfo(startParent,piece,square,move=undefined){
  let from, to;
  if (move){
    from = move[0];
    to = move[1];
  } else {
    from = getRowCol(startParent);
    to = getRowCol(square); 
  }
  return [from,to,piece.constructor.name] 
}