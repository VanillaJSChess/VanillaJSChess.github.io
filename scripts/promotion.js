let midPromotion = false;
function promotion(side){
  midPromotion = true;
  if (playingComputer && !turn) { //asuming black is computer 
    return
  }
  let px = side ? 'p1':'p2';
  let promotionPieces = ['queen','rook','bishop','knight']
  let showPieces = promotionPieces.map(x=>px+x)
  
  for (i=0;i<promotionBox.childElementCount;i++){
    promotionBox.children[i].classList.add(showPieces[i]);
  }
  promotionBox.style.visibility = 'visible';
}

function promotionSelected(piece = null, computerPromotion = false, forcePromote = null){
  midPromotion = false
  let newPieceType;
  
  if (computerPromotion){
    newPieceType = "queen"
    moveHistory[moveHistory.length-1].promotion = forcePromote;
  } else {
    promotionBox.style.visibility = 'hidden';
    newPieceType = piece.classList[1].substring(2);
  }

  let rowCol = moveHistory[moveHistory.length-1].move[1];
  
  promotePiece(rowCol, newPieceType);
  
  moveHistory[moveHistory.length-1].promotion = newPieceType[0].toUpperCase();
  window.requestAnimationFrame(()=>{swapTurn(0)});
}

function promotePiece(rowCol, newPieceType){
  let pieceNode = Array.from(boardNode.children[rowCol[0]].children[rowCol[1]].children).find(piece=>piece.classList.contains("piece"))
  let originalPawn = pieceMap.get(pieceNode);
  
//   let originalPawn = boards[0].state[rowCol[0]][rowCol[1]];
//   let pieceNode = originalPawn.piece

  pieceNode.classList.remove('pawn');
  if (newPieceType.length === 1){
    newPieceType = getPieceNameFromLetter(newPieceType);
  }
  pieceNode.classList.add(newPieceType);

  let promotedPiece = createPromotedPiece(newPieceType,pieceNode)
  promotedPiece.rowCol = rowCol;
  promotedPiece.homeSquare = originalPawn.homeSquare;
  promotedPiece.promoted = true;
  boards[0].state[rowCol[0]][rowCol[1]] = promotedPiece;
}

function undoPromotion(piece){
  let pieceNode = piece.piece;
  let originalHomeSquare = piece.homeSquare
  let originalRowCol= piece.rowCol
  pieceNode.classList.remove(pieceNode.classList[pieceNode.classList.length-1]);
  pieceNode.classList.add("pawn");
  boards[0].state[piece.rowCol[0]][piece.rowCol[1]] = new Pawn(pieceNode);
  boards[0].state[piece.rowCol[0]][piece.rowCol[1]].rowCol = originalRowCol;
  boards[0].state[piece.rowCol[0]][piece.rowCol[1]].homeSquare = originalHomeSquare;
}

function getPieceNameFromLetter(letter){
  letter = letter.toUpperCase();

  if (letter === "Q") {
    return "queen" 
  } else if (letter === "N") {
    return "knight"
  } else if (letter === "R") {
    return "rook"  
  } else if (letter === "B") {
    return "bishop" 
  }

}

function createPromotedPiece(newPieceType,pieceNode){
  if (newPieceType === "queen") {
    return new Queen(pieceNode); 
  } else if (newPieceType === "knight") {
    return new Knight(pieceNode);     
  } else if (newPieceType === "rook") {
    return new Rook(pieceNode);   
  } else if (newPieceType === "bishop") {
    return new Bishop(pieceNode); 
  }
}