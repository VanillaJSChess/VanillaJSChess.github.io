class ChessPiece{
  constructor(piece){
    this.piece = piece,
    this.color = isp1(this.piece),
    pieceMap.set(this.piece,this),
    this.hasMoved = false;
    this.maxSquareTravel = 7; //should the piece continue looking for open squares
    this.isCaptured = false;
    this.hasCastled = false;
    this.attackedBy = []; //enemy pieces with legal captures of this piece
    this.defendedBy = []; //friendly pieces that can recapture if necessary
    this.rowCol = []; //what is the x,y location of the piece 
    this.action = { //legal and potential moves 
      potential : { moves:[],
                    captures:[],
                    defends:[] },
      legal :     { moves:[],
                    captures:[],
                    defends:[] }
    }
    this.boardID = 0; //which board does this piece's moves correspond to
    this.promoted = false; //for pawns only 
    this.homeSquare = undefined;
  }

  getHomeSquare(){ //needs to run after start animation. Maybe just remove start animation or hardcaode homeSquare
    //should only be called for board[0]. copies shouldnt use this function 
    this.homeSquare = this.piece.parentElement;
    this.rowCol = getRowCol(this.piece.parentElement);
  }

  displayMoves(){
    [this.action.legal.moves,this.action.legal.captures].forEach(type=>{
      type.forEach(move=>{
        //remove the hidden class and bring the avail move icon to the front
        //avail move icon should always be the first child of the square 
        let square =  boardNode.children[move[0]].children[move[1]];
        square.children[0].classList.remove('hidden'); 
        square.children[0].style.zIndex = '2';
      });
    });
  }

  getLegalMoves(piecesOnBoard, enemyPiecesWithCaptures){
    //gets potential moves then considers them legal in they cant be made without letting the king in check 
    let board = boards[this.boardID].state; //which board is being considered 
    this.getPotentialMoves(board);
    if(enemyPiecesWithCaptures.length > 0 && !this.kingSafeIfRemoved(enemyPiecesWithCaptures,board)){
      //if there are enemy pieces with captures and the king is in check if this piece is removed 
      this.addMoveifKingisSafeFrom(enemyPiecesWithCaptures,board); //see if the king is in check for each of the pieces moves
    } else { //consider all potential moves legal 
       this.action.legal.moves = [...this.action.potential.moves]; 
       this.action.legal.captures = [...this.action.potential.captures];
       this.action.legal.defends = [...this.action.potential.defends];
    }
  }

  getPotentialMoves(board){
    let row, col;
    //looks at each direction (8 possible directions) and checks each square in that direction as long as the piece isnt blocked
    //rooks, bishops look in 4 directions, pawns look in 1
    this.directionArray.forEach(dir=>{ 
      for(let i=1;i<=this.maxSquareTravel;i++){
        row = this.rowCol[0]+dir[0]*i; //set to look one more square in each direction 
        col = this.rowCol[1]+dir[1]*i;
        if (row > 7 || row < 0 || col > 7 || col < 0){break} //ends if it is off the board 
        if(this.pieceBlocked(row,col,board)){ // if it hits another piece 
          break
        } 
      }
    });
  }

  pieceBlocked(row,col,board){
    let potentialSquare = board[row][col]; //see whats on the square 
    if (potentialSquare === undefined) {return true} // undefinded means not a square (should be piece or null)
    if(potentialSquare === null){ 
      this.action.potential.moves.push([row,col]);//if null it is an open square 
    }
    else if(potentialSquare.color === !this.color){ //if the piece on the square is another color it is a capture 
      this.action.potential.captures.push([row,col]);
      return true;
    } else {
      this.action.potential.defends.push([row,col]); //same color is a defense 
      return true;
    }
  }

  kingSafeIfRemoved(enemyPiecesWithCaptures,board){
    //finds out if the pieces moves need to be considered to see if the king is in check
    //this step is important because it prevents seeing if the king is safe for every piece's moves 
    board[this.rowCol[0]][this.rowCol[1]] = null; //set the pieces current locatin as empty 
    let safe = this.kingSafe(enemyPiecesWithCaptures,board); //check if the king is in check from any pieces with captures 
    board[this.rowCol[0]][this.rowCol[1]] = this; //return the piece to the board 
    return safe;
  }

  addMoveifKingisSafeFrom(piecesToCheck,board){
    let capturablePiece,defendedPiece,enPassant;
    this.action.potential.moves = this.action.potential.moves.filter(val=>val!==undefined); // remove any bpgus moves
    //go thrpugh the potential moves and see the board state for each move. 
    //if the king is in check in a state do not save as legal move
    board[this.rowCol[0]][this.rowCol[1]] = null; //remove the piece from the board (to be moved somewhere else)
    this.action.potential.moves.forEach(move=>{
      if(boards[this.boardID].state[move[0]][move[1]] !== null){ //if one of the moves is wrong (it shouldnt be)
        return
      }
     board[move[0]][move[1]] = this; //move the piece to the new square 
      if (this.kingSafe(piecesToCheck,board)){ // if the king is not in check 
        this.action.legal.moves.push(move); 
      }
     board[move[0]][move[1]] = null; //move the piece back 
    }); 

    this.action.potential.captures.forEach(move=>{
      capturablePiece = board[move[0]][move[1]];
      if (!capturablePiece && this.constructor.name === "Pawn") { //if it is a pawn check for en passant 
        capturablePiece = board[move[0]-this.direction][move[1]];
        board[capturablePiece.rowCol[0]][capturablePiece.rowCol[1]] = null;
        if (!capturablePiece) { throw 'no capturable piece found where expected'}
        enPassant = true;
      } 
      capturablePiece.isCaptured = true; 
      board[move[0]][move[1]] = this; //add this piece to where the old piece was 
      if (this.kingSafe(piecesToCheck,board)){
        this.action.legal.captures.push(move); //add capture if king is safe 
      }
      if (enPassant){ //put the captured piece back 
        board[capturablePiece.rowCol[0]][capturablePiece.rowCol[1]] = capturablePiece
        board[move[0]][move[1]] = null;
        enPassant = false;
      } else {
        board[move[0]][move[1]] = capturablePiece;   
      }
      
      capturablePiece.isCaptured = false 
     });
   board[this.rowCol[0]][this.rowCol[1]] = this; //put the original back    
  }

  kingSafe(piecesToCheck,board){ //runs for every available move 
    //called with a simulated board state 
    //probably a weak point of the code 
    let safe = true;
    let originalMoves;
    piecesToCheck.forEach(piece=>{
      if (!piece.isCaptured){
        originalMoves = piece.action;//hold the pieces original moves 
        piece.clearPotentialMoves();
        piece.getPotentialMoves(board); //get potential moves of pieces with simulated board state 
        if (piece.action.potential.captures.length > 0){
          piece.action.potential.captures.forEach(function(capture){
            //check if the piece being captured is a king
            let target = boards[piece.boardID].state[capture[0]][capture[1]]; 
            if (target === null) {  }
            else if (target.isKing){
              safe = false;
              return safe; //unsure for multiple checks 
            }
          });
        }
        piece.action = originalMoves; //undo the simulated potential moves
      }
    });
    return safe; //the king was never attacked 
  }

  clearLegalMoves(){ 
    this.action = {
      potential : { moves:[],
                    captures:[],
                    defends:[] },
      legal :     { moves:[],
                    captures:[],
                    defends:[] }
    }                
  }

  clearPotentialMoves(){
    this.action.potential = { moves:[],
                              captures:[],
                              defends:[] }
  }
}

class Pawn extends ChessPiece {
  constructor(piece){
    super(piece)
    if(this.color){
      this.direction = -1;
    } else { 
      this.direction = 1;
    }
    this.value = 1;
  }
  
  getPotentialMoves(board){
    //pawn has specical functions because they take diagonally 
    this.lookForTake();
    let row;
    let col = this.rowCol[1];
    for(let i=1;i<=1+!this.hasMoved;i++){
      row = this.rowCol[0]+this.direction*i;
      if (row > 7 || row < 0 || col > 7 || col < 0){break}
      let potentialSquare = board[row][col];
      if (potentialSquare === null){
        this.action.potential.moves.push([row,col])
      } else { break }
    }
  }

  lookForTake(){
    let leftOrRightMove = 1;
    let prevMovePiece;
    let row = this.rowCol[0]+this.direction; //can only take in one direction 
    let col;

    for(let i=1;i<=2;i++){
      col = this.rowCol[1]+leftOrRightMove;
      leftOrRightMove = -1; //swap to left after checking right 
      if (col > 7 || col < 0 || row > 7 || row < 0){continue} //move to next if off the board 
      let potentialSquare = boards[this.boardID].state[row][col];
      //checking for en passant 
      if (potentialSquare === null){ 
        if (moveHistory.length > 0) {
          prevMovePiece = (moveHistory[moveHistory.length-1].move[2]) //see what piece moved last 
        } else {
          prevMovePiece = undefined;
        }
        if (prevMovePiece === 'Pawn'){
          if (this.checkEnPassant(row,col)){ // if pawn, check en passant 
            this.action.potential.captures.push([row,col]);  
          }
        }
        continue
      }
      if (potentialSquare.color !== this.color){
        this.action.potential.captures.push([row,col]);
      } else {
        this.action.potential.defends.push([row,col]);
      }
    }
  }

  checkEnPassant(row,col){
    let move = moveHistory[moveHistory.length-1].move;
    if (move[0][1] === move[1][1] && move[0][1] === col){ //if the pawn is directly to the right or left 
      if (Math.abs(move[0][0]-move[1][0])>1){ //if the pawn moved 2 squares 
        if (row === move[0][0] - this.direction){ //if it moved past the row where the pawn can take
          return true
        }
      }
    }
  }
}

class Knight extends ChessPiece {
  constructor(piece){
    super(piece)
    this.directionArray = [[1,2],[1,-2],[2,-1],[2,1],[-1,2],[-1,-2],[-2,-1],[-2,1]]
    this.maxSquareTravel = 1; 
    this.value = 3;
  }
}

class Bishop extends ChessPiece {
  constructor(piece){
    super(piece)
    this.directionArray = [[1,1],[-1,-1],[1,-1],[-1,1]];
    this.value = 3;
  }
}

class Rook extends ChessPiece {
  constructor(piece){
    super(piece)
    this.directionArray = [[0,1],[1,0],[0,-1],[-1,0]];
    this.value = 5;
  }
}

class Queen extends ChessPiece {
  constructor(piece){
    super(piece)
    this.directionArray = [[0,1],[1,0],[0,-1],[-1,0],[1,1],[-1,-1],[1,-1],[-1,1]];
    this.value = 9;
  }
}

class King extends ChessPiece {
  constructor(piece){
    super(piece)
    this.directionArray = [[0,1],[1,0],[0,-1],[-1,0],[1,1],[-1,-1],[1,-1],[-1,1]];
    this.maxSquareTravel = 1; 
    this.isKing = true;
    this.value = NaN; //dont consider the king to have value because any captured king should be handled as a must do or must avoid 
  }
  getLegalMoves(piecesOnBoard){
    //king moves
    let board = boards[this.boardID].state; //which board is being considered 
    this.getPotentialMoves(board);
    this.checkIfCanCastle(piecesOnBoard);
    this.addMoveifKingisSafeFrom(piecesOnBoard[!this.color],board); //all king moves must be checked for legality 
    this.action.legal.defends = [...this.action.potential.defends]; //filtered later 

  }
  checkIfCanCastle(piecesOnBoard){ 
    if (this.attackedBy.length>0){return} //cant castle with king in check 
    let squareSafe = (direction)=>{ 
      let canCastle = true;
      let traversedSquare = this.rowCol[1] + direction //go along the row 
      piecesOnBoard[!this.color].forEach(piece=>{
        piece.action.legal.moves.forEach(move=>{
          if(move[0] === this.rowCol[0]){
            if (move[1] === traversedSquare){
              canCastle = false //check the squares for enemy potential moves. if the king is intercepted it cannot castle 
            }
          }
        });
      });
      return canCastle
    }
    let lookForRook = (direction)=>{
      let closestPieceRow;
      const increment = direction;
      while (boards[this.boardID].state[this.rowCol[0]][this.rowCol[1]+direction] === null ) {
        direction = direction+increment; //go across in the direction until you hit a piece 
      }
      closestPieceRow = boards[this.boardID].state[this.rowCol[0]][this.rowCol[1]+direction];
      if(closestPieceRow){ //if there is a piece on this row that is a rook that hasnt moved 
        if (closestPieceRow.constructor.name === 'Rook'){
          if (closestPieceRow.hasMoved === false){
            if (squareSafe(increment)){ //check for castle path interception 
              this.action.potential.moves.push([this.rowCol[0],this.rowCol[1]+increment*2])  
            }
          }
        }
      }
    }
    if (this.hasMoved !== true){ // look for a rook both ways if the king hasnt moved yet 
      lookForRook(1);
      lookForRook(-1);
    }
  }
}