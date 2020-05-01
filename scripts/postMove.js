let canAnimate = true
function completeMoveFromState(move,shouldUpdate=true){
  return new Promise((resolve,reject)=>{
    let startParent = boardNode.children[move[0][0]].children[move[0][1]];
    let square = boardNode.children[move[1][0]].children[move[1][1]];
    let piece = Array.from(startParent.children).find(child=>child.classList.contains('piece'))
    completeMove(startParent,piece,square,shouldUpdate,move).then(()=>{
      resolve();
    });
  });
}

function completeMove(startParent,piece,square, shouldUpdate = true, move = undefined){
  return new Promise((resolve,reject)=>{
    handleSquareHighlightsMove(startParent,square);
    movePiece(piece, square).then(()=>{
      if (shouldUpdate){
        checkSpecialtyMove(move);
      }
      resolve();
    });  
  });

  function checkSpecialtyMove(move){
    moveHistory.push({move:[]});
    if (piece.classList.contains('king')){
      let castleMove = checkForCastle(getRowCol(startParent),getRowCol(piece.parentElement));

      if (castleMove) {
        pieceMap.get(piece).hasCastled = true;
        updateDisplayedBoardState(startParent,pieceMap.get(piece),square,move);
        moveHistory[moveHistory.length-1].castle = castleMove;
        completeMoveFromState(castleMove,false).then(()=>{
          updateDisplayedBoardState(undefined,undefined,undefined,castleMove);

          swapTurn(0)
        });
        return   
      }
    } else if (piece.classList.contains('pawn')) {
      checkPromotion(piece);
      if (midPromotion) {
        updateDisplayedBoardState(startParent,pieceMap.get(piece),square,move);
        isPieceCaptured(square); 
        if (playingComputer && !turn){
          promotionSelected(undefined,computerPromotion = true, forcePromote ='Q');
        }
        return 
      }
    }
    updateDisplayedBoardState(startParent,pieceMap.get(piece),square,move);
    isPieceCaptured(square).then(()=>{
      swapTurn(0);
    });
    
    function checkPromotion(piece){
      let rowCol = getRowCol(square);
      let row = rowCol[0];
      if (row === 0 || row === 7) {
        promotion(isp1(piece));
      }
    }
  }
  
  function isPieceCaptured(square){
    return new Promise((resolve,reject)=>{
      let capturedPiece;
      if (Array.from(square.children).filter(child=>child.classList.contains('piece')).length>=2){
        capturedPiece = pieceMap.get(Array.from(square.children).find(child=>child.classList.contains('piece')));   
      }

      if (!capturedPiece && piece.classList.contains('pawn')){
        let rowCol = getRowCol(piece.parentElement);
        let direction = pieceMap.get(piece).direction;
        capturedPiece = boards[0].state[rowCol[0]-direction][rowCol[1]];
        if (capturedPiece){
          boards[0].state[rowCol[0]-direction][rowCol[1]] = null;
          moveHistory[moveHistory.length-1].enPassant = [rowCol[0]-direction,rowCol[1]];
        }
      }

      if (capturedPiece) {
        moveHistory[moveHistory.length-1].capture = capturedPiece;
        capturedPiece.isCaptured = true;
          stackPiece(capturedPiece.piece).then(()=>{
            resolve();
          });
      } else {
        resolve();
      }
    });
  }
}

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

function updateDisplayedBoardState(startParent,piece,square,move=undefined){
  let from, to;
  if (move){
    from = move[0];
    to = move[1];
    piece = boards[0].state[from[0]][from[1]];
  } else {
    from = getRowCol(startParent);
    to = getRowCol(square); 
  }
  if (!moveHistory[moveHistory.length-1].castle){
    moveHistory[moveHistory.length-1].move = [from,to,piece.constructor.name]
  }
  boards[0].state[from[0]][from[1]] = null;
  boards[0].state[to[0]][to[1]] = piece;
  piece.rowCol = [to[0],to[1]]
  piece.hasMoved = true;
  boards[0].rating = 0;
}