let //collection of p1 and p2 nodes
p1pieces = document.querySelectorAll('.p1piece'), 
p2pieces = document.querySelectorAll('.p2piece'), 
//where the pieces move to when captured
p1graveyard = document.querySelector('#p1graveyard'), 
p2graveyard = document.querySelector('#p2graveyard'), 
//forefeit buttons
forfeitBanner = document.querySelector('.forfeit-banner'), 
ffyes = document.querySelector('#ff-yes'), 
ffno = document.querySelector('#ff-no'), 
//area used to drag pieces around. maybe not needed 
pieceArea = document.querySelector('#piece-area'), 
boardNode = document.querySelector('#board'),
//icons and score 
p1icon = document.querySelector('#p1icon'), 
p2icon = document.querySelector('#p2icon'), 
p1s = document.querySelector('#p1s'), 
p2s = document.querySelector('#p2s'), 
//win or draw display
winner1 = document.querySelector('#winner1'), 
winner2 = document.querySelector('#winner2'), 
drawNode =  document.querySelector('#draw'),
//buttons
newGameButton = document.querySelector('#new'), 
forfeit = document.querySelector('#forfeit'), 
reset = document.querySelector('#reset'), 
toggleFirst = document.querySelector('#toggleFirst'), 
toggleComputer = document.querySelector('#toggleComputer'), 
toPrevMove = document.querySelector('#prev-move'), 
toNextMove = document.querySelector('#next-move'),
//promotion background and pieces 
promotionBox = document.querySelector('#choose-promotion'),
promotionPieces = document.querySelectorAll('.promotion-piece'),
availMoveIcons = document.querySelectorAll('.avail-move'), //icons to appear on squares with legal moves
//displays when computerMove in excecution 
thinking = document.querySelector('#thinking'),
firstMove = true, //p1 or p2 moves first 
winnerBool = false, //if either side has won
drawBool = false, //if either side has drawn
activePiece, //previously clicked piece
// posStrength, 
turn, //is it p1 or p2 move
thinkingInProg, //blocks button clicks while waiting on computer move 
playingComputer, //should the computer try to move 
computerPlayer = false;

const onMobile = true//mobileCheck();
//console.log(onMobile)

let boards = [{state:[],rating:[]}] //hols displayed and all simulated moves 
let moveHistory = []; //lists all prev moves with some details 

function takeOverAndRefindMoves(){
  //used to pick up manually from any boardstate
  playingComputer = false;
  piecesOnBoard = getPiecesOnBoard(boards[0])
  pickUpFromCurrentPosition()
}

//performance 
let t0,t1;
let performanceTrack = {true:[],false:[]};
console.log(5)
// classes
let pieceMap = new Map();//connects the piece nodes to the classes

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
        square.children[0].style.zIndex = '1';
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
    let safe = kingSafe(enemyPiecesWithCaptures,board); //check if the king is in check from any pieces with captures 
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
      if (kingSafe(piecesToCheck,board)){ // if the king is not in check 
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
      if (kingSafe(piecesToCheck,board)){
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

function kingSafe(piecesToCheck,board){ //runs for every available move 
  //called with a simulated board state 
  //probably a weak point of the code 
  let safe = true;
  let orinialMoves;
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


//new game/reset/start 

function resetAll() {
  firstMove = true; //p1 goes first 
  if (!p1pieces[0].classList.contains('white')){ //if this results in a side swap, flip the king and queen
   flipKingAndQueen();
  }
  playingComputer = true;
  p1s.innerText = 0; //reset scores 
  p2s.innerText = 0;
  newMatch(); 
  switchSides(true); //ensures p1 is white and p2 is black
  setMoveIcons();

}

function switchSides(reset = false){
  let p1is, p2is;
  if (reset){
    p1is = 'black';
    p2is = 'white';
    turn = true;
  }else if (p1pieces[0].classList.contains('white')){
    p1is = 'white';
    p2is = 'black';
    turn = false;
  } else {
    p1is = 'black';
    p2is = 'white';
    turn = true;
  }
  Array.from(p1pieces).forEach(piece=>{
    piece.classList.remove(p1is);
    piece.classList.add(p2is);
  })
  Array.from(p2pieces).forEach(piece=>{
    piece.classList.add(p1is);
    piece.classList.remove(p2is);
  });
}

function newMatch() {

  addOrRemoveThinking();
  emptyHistoryCollections();
  resetFFbutton()
  unhighlightAllSquares();
  clearWinner();
  turn = firstMove;  
  colorPlayerIcons();
  movePromises = populateBoard(); //grab all the pieces that need to move to their homeSqures 
  resetPieces();
  Promise.all(movePromises).then(()=>{
    //move all pieces then save their new squares as home squares
    if (!pieceMap.get(p1pieces[0]).homeSquare){
      getHomeSquares(); 
    }
    boards[0].state = buildDisplayedBoardArray();
    pickUpFromCurrentPosition() //gets all legal moves for current visible boardstate 
    if (!turn && playingComputer){ //if the computer moves first 
      doNormalComputerMove();
    }
  })

  function emptyHistoryCollections(){
    //empty tracking done from last game
    undoneMoves = [];
    moveHistory = [];
    graveyardOffsets = {true:{},false:{}}
  }

  function addOrRemoveThinking() {
    if (firstMove){
      thinking.classList.remove('visible');
      thinkingInProg = false;
    } else {
      thinking.classList.add('visible');
      thinkingInProg = true; 
    }
  }
  function resetFFbutton(){
    forfeit.innerText = 'Forfeit';
    forfeit.classList.add('forfeit-color')
    forfeit.classList.remove('new-game-color')
  }
  function resetPieces(){
  //remove the moves and statuses of each piece 
  Array.from(pieceMap.values()).forEach(piece=>{
    piece.clearLegalMoves();
    piece.isCaptured = false;
    piece.hasCastled = false;
    piece.hasMoved = false; 
    if (piece.promoted) {
      undoPromotion(piece)
    }

    function undoPromotion(piece){
//       let pieceNode = boardNode.children[piece.rowCol[0]].children[piece.rowCol[1]].children[1];
      let pieceNode = piece.piece;
      let originalHomeSquare = piece.homeSquare
      pieceNode.classList.remove(pieceNode.classList[2]);
      pieceNode.classList.add("pawn");
      boards[0].state[piece.rowCol[0]][piece.rowCol[1]] = new Pawn(pieceNode);
      boards[0].state[piece.rowCol[0]][piece.rowCol[1]].homeSquare = originalHomeSquare;
    }
  })
  
}
}



function buildDisplayedBoardArray(){
  //resets the boards[0].state so that it is the opening position 
  let displayedBoard = [];
  for(let i=0; i<8;i++){
    displayedBoard.push([]);
    for(let j=0;j<8;j++){
      piece = pieceMap.get(boardNode.children[i].children[j].children[1]);
      if(piece){
        displayedBoard[i].push(piece); 
      } else {
        displayedBoard[i].push(null); 
      }
    }
  }
  return displayedBoard;
}

function getHomeSquares(){
  //can add a boolean to check if homeSquares have been set
  //problem is they cant be set until after the init or they must be hard coded
  Array.from(pieceMap.values()).forEach(piece=>{
    piece.getHomeSquare();
  });
}

function createPieceLists(){
  //creates a class for each piece on board 
  let pieces = [['.pawn',Pawn],['.knight',Knight], ['.bishop',Bishop], 
                ['.rook',Rook], ['.queen',Queen], ['.king',King]];
  pieces.forEach(pieceType=>{
    document.querySelectorAll(pieceType[0]).forEach(piece=>new pieceType[1](piece))
  });
}

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
//       if (f8count === 52) {debugger}
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

function rateBoardstate(piecesOnBoard,boardIndex){ 
  //determines how good a position is depending on a weighted average of the position strength 
  //considers: value of pieces on the board, how many pieces are under attack, how defended the pieces are, and what pieces on the board are controlled 
  let posStrength = { true: { pieceSum: 0, 
                          squareControl: 0,
                          pieceDanger:0,
                          pieceSecurity:0, 
                          development:0},
                  false: { pieceSum: 0, 
                           squareControl: 0,
                           pieceDanger:0,
                           pieceSecurity:0, 
                           development:0 }
                }
  let legalOrPotential;

//   if (boards.length === 2){debugger}
  Object.values(piecesOnBoard).forEach(side=>{
    legalOrPotential = 'legal';
    let kingAttackers = side.find(piece=>piece.isKing).attackedBy; 
    if (kingAttackers.length === 1){
      if (boards[boardIndex].state[kingAttackers[0][0]][kingAttackers[0][1]].attackedBy.length > 0) {
        //prevents the computer from making unecessary checks just to remove potential moves 
        //cant do potential moves all the time though becuase it is good to prevent moves with safe checks 
        legalOrPotential = 'potential';
      }
    }
    side.forEach(piece=>{
      if (!piece.isKing){ //only rate development for king because that includes castling. 
        getPieceSum(piece);
        hangingVSdefended(piece);
        controlledSquares(piece)
      };
      rateDevelopment(piece);
    });
  });


  let whiteSum = sumPosStrength(posStrength[true]);
  let blackSum = sumPosStrength(posStrength[false]);
//   try {
//     if (boards[boardIndex].state[5][2].constructor.name === "Bishop") {debugger}
//   }  catch {} 
//   console.log([whiteSum,blackSum])
  return [whiteSum,blackSum]

  function sumPosStrength(side){
    //weights based on guess + trial and error 
    return side.pieceSum*1.25 + 
           side.pieceDanger + 
           (side.squareControl)/20  + 
           (side.pieceSecurity)/10  + 
           (side.development)/5
  }
  
  function getPieceSum(piece){ //sum value of all the pieces owned
    posStrength[piece.color].pieceSum += piece.value; 
  }

  function controlledSquares(piece){ //sum the value of all the squares where each piece can move, attack, or defend 
    //calculated regardless of if the square is under attack 
    //maybe go through each piece and each move and make a board array that sums the number of pieces controlling or attacking a square
    //and calculate it that way 
    let rowValArray = [0,1,3,6,6,3,1,0];
    let colValArray = [0,1,3,6,6,3,1,0];

    if (piece.constructor.name === 'Pawn'){ //calculate only attacked sqaures for pawns (diagonals)
      if (moveHistory.length > 50 && piecesOnBoard[piece.color].length<8){
        if (piece.color) {
          rowValArray = [7,6,5,4,3,2,1,0];
        } else {
          rowValArray = [0,1,2,3,4,5,6,7];
        }
        let colValArray = [4,4,4,4,4,4,4,4];
      }
      posStrength[piece.color].squareControl += getPawnValue();
    }


    let squareValueSum = 0;
    let totalMoves = 0;
    Object.values(piece.action[legalOrPotential]).forEach(moveType=>{ 
      totalMoves += moveType.length;
      moveType.forEach(move=>{
        squareValueSum += rowValArray[move[0]]+colValArray[move[1]];
      });
    });
    if (totalMoves > 10) {
      squareValueSum /= 1.5
    } 
    posStrength[piece.color].squareControl += squareValueSum;
    
    function getPawnValue(){
      if (piece.rowCol[1] > 1){ //if the pawn can move left
        return getSquareValuePawn(-1);
      } else if (piece.rowCol[1] < 7) { //if the pawn can move right
        return getSquareValuePawn(1);
      }
      function getSquareValuePawn(leftOrRightMove){
        if (piece.rowCol[0] === 0 || piece.rowCol[0] === 7) { return 9*50 } //promotion highly favorable
        let attackRight = [piece.rowCol[0] + piece.direction, piece.rowCol[1] + leftOrRightMove] 
        let squareValue = rowValArray[attackRight[0]] + colValArray[attackRight[1]];
        return squareValue;
      }
    }
  }

  function hangingVSdefended(piece){
    let attackersC = piece.attackedBy.length;
    let defendersC = piece.defendedBy.length; 

    if (attackersC === 0){ //no attackers 
      posStrength[piece.color].pieceSecurity += defendersC;
      return 
    }
    if (attackersC > 0 && defendersC === 0){ //atttackers with no defenders 
      //if a piece is hanging but it is your turn the position isnt bad because you can move
      //if you have a piece hanging but the oppenent does too you shouldnt get the benefit of their hanging piece
      //if you have 2 pieces hanging and cant defend them with one move you lose the power of the weaker piece
      if (piece.color === turn) { return } 
      posStrength[piece.color].pieceDanger -= piece.value;
      return 
    }
    //attackers and defenders 
    //see if the attackers are worth it because they may be easily captured 
    let attackers = piece.attackedBy.map(checkAttackerValidity).filter(x=>x!==undefined).sort((a, b) => a-b);
    let defenders = piece.defendedBy.map(getPieceValueOnSquare).filter(x=>x!==undefined).sort((a, b) => b-a);
    let pieceContentionScore = piece.value;
    
    attackers.forEach((attacker,i)=>{
      if (defendersC > 0){
        pieceContentionScore -= attacker;
        defendersC--
        if (pieceContentionScore > 0 ){ //piece defended but by a more valuable piece(s) OR piece attacked by a less valueable piece
          posStrength[piece.color].pieceDanger -= pieceContentionScore; 
          checkForks(piece)
        } else {
          if (i <= attackersC) {
            pieceContentionScore += defenders[defendersC];
          } else {
            debugger
          }
        }
      } else {
        if (pieceContentionScore - attacker >= 0){
          posStrength[piece.color].pieceDanger -= pieceContentionScore; 
        }
      }
    });
    if (pieceContentionScore < 0) { //piece defended 
      posStrength[piece.color].pieceSecurity += 1
    }

    function checkAttackerValidity(square) {
      //returns a value if the attacker is directly a threat to the piece. It is not a threat if it can 
      //be captured freely before it attacks or if it captures it is actually better for the side it is capturing 
      let attacker = boards[piece.boardID].state[square[0]][square[1]]
      if (attacker.color === turn) { return getPieceValueOnSquare(square) } //If the attacker can move this turn it is a threat 
      if(attacker.attackedBy.length === 0){
        //if the attacker is unattacked it is a threat
        return getPieceValueOnSquare(square)
      }
      else if  (attacker.defendedBy.length === 0 ){ 
        //if the attacker is attacked and undefended dont count it 
        return
      } else {
        //if the attacker has a defender 
        let attackers = attacker.attackedBy.map(getPieceValueOnSquare).sort((a, b) => a-b);
        let defenders = attacker.defendedBy.map(getPieceValueOnSquare).sort((a, b) => a-b);
        let pieceContentionScore = attacker.value;
        let tradeValue = tradeEvaluation(attackers,defenders,pieceContentionScore);
        if (tradeValue > 0) {//attacking piece is capturable at a benefit to the enemy 
          return 
        } else if (tradeValue < 0) { //piece defended or bad to capture
          return getPieceValueOnSquare(square)
        } else {
          //toss up. go with agression of computer
          return getPieceValueOnSquare(square)
        }
      }
    }

    function tradeEvaluation(attackers,defenders,pieceContentionScore){
      //see if the attacking piece in question has move valuable attackers or defenders. 
      let defendersC = defenders.length;
      let attackersC = attackers.length;
      attackers.forEach((attacker,i)=>{
        if (defenders.length > 0){
          pieceContentionScore -= attacker;
//           defendersC--
          if (pieceContentionScore > 0 ){ 
            //piece defended but by a more valuable piece(s) OR piece attacked by a less valueable piece
            return pieceContentionScore
          } else {
            if (i <= attackersC) { //if we arent done with attackers, add value of defenders 
              pieceContentionScore += defenders.shift();
            }
          }
        }
      });
      return pieceContentionScore
    }

    function getPieceValueOnSquare(square,attacker=null){
      let piece = boards[boards.length-1].state[square[0]][square[1]];
      if (!piece) {
        piece = boards[boards.length-1].state[square[0]-attacker.direction][square[1]];
      }
      return piece.value
    }
    function checkForks(piece) {
      piece.attackedBy.forEach(attackerSquare=>{
        let attacker = boards[piece.boardID].state[attackerSquare[0]][attackerSquare[1]]
        let attackerMoves = attacker.action.legal.captures
        if (attackerMoves.length > 1) {
          let piecesInDanger = attackerMoves.map((move)=>getPieceValueOnSquare(move,attacker))
          piecesInDanger = piecesInDanger.map(value=>{if(!value){return Math.min(...piecesInDanger.filter(x=>x))}else{return value}})
          piecesInDanger.sort((a, b) => a-b);//
 
          posStrength[piece.color].pieceDanger -= piecesInDanger[0]*1.5
        }
      })
    }
  }
  
  function rateDevelopment(piece) {
    if (piece.isKing){
      if (piece.hasMoved){
        if (piece.hasCastled) {
          posStrength[piece.color].development += 4; 
        } else {
          if (moveHistory.length < 30){
            posStrength[piece.color].development -= 5; 
          } else {
            posStrength[piece.color].development += 1; 
          }
        }
      } 
      return
    } 
    if (piece.hasMoved){
      if (piece.constructor.name === 'Pawn'){
        posStrength[piece.color].development += 1;
      } else if (piece.constructor.name === 'Rook' || piece.constructor.name === 'Queen') {
        checkOpenFile(piece);
        if (moveHistory.length > 7){
          if ((piece.rowCol[0] === 7) !== piece.color || (piece.rowCol[0] === 0) !== !piece.color){
            posStrength[piece.color].development += 1;
          }
        }
      } else {
        posStrength[piece.color].development += 2;
      }
    }
    function checkOpenFile(piece){
//       debugger
    }
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

function getPiecesOnBoard(board){
  let piecesOnBoard = {true: [],
                   false: []}
  board.state.forEach(row=>{
    row.forEach(square=>{
      if(square){ 
        piecesOnBoard[square.color].push(square)
      }
    });
  });
  return piecesOnBoard;
}

function swapTurn(boardIndex) {
  thinking.classList.remove('visible')
  thinkingInProg = false;
  document.activeElement.blur();

  document.getElementById('main-container').click()

  if (winnerBool || drawBool || midPromotion){ return }
  prevShownRatedMove = undefined;
  //turn = !turn;
  colorPlayerIcons()
  oldMovesOutNewMovesIn(boardIndex);
  checkRepetition()
  if (playingComputer && !turn) {
    thinking.classList.add('visible')
    thinkingInProg = true;
    window.requestAnimationFrame(()=>{
      if (winnerBool || drawBool || midPromotion){ return }
      t0 = performance.now()
      let nextMove = computerMove(0,4,6);
      lastDitchEffortAttempted = false;
      t1 = performance.now();
//       console.log(t1-t0);
      if (nextMove){
        completeMoveFromState([nextMove.from,nextMove.to])
      } else {
        winner(!turn)
      }
    });
  }
  checkWinOrDraw();
}

let repetitionCount = 0;
let prevState;
function checkRepetition(){
  let simplifiedBoard = makeSimplifiedBoardstate(boards[0].state);
  if (moveHistory.length === 0 || moveHistory.capture || moveHistory.castle || moveHistory[moveHistory.length-1].move[2] === "Pawn"){
    repetitionCount = 0;
    prevState = simplifiedBoard;
    return 
  }
  let lastMove = moveHistory[moveHistory.length-1].move
  
  prevState = JSON.parse(JSON.stringify(simplifiedBoard));
  prevState[lastMove[1][0]][lastMove[1][1]] = null;
  prevState[lastMove[0][0]][lastMove[0][1]] = lastMove[2];

  checkSimilarity(simplifiedBoard,prevState) //dont actually look at the previous boardstate, look at the previous previous state.
  
  function checkSimilarity(board1,board2){
    for (let i=0;i<8;i++){
      for (let j=0;j<8;j++){
        if (board1[i][j] !== board2[i][j]){
          repetitionCount = 0;
          return;
        }
      }
    }
    repetitionCount +=1;
    debugger;
  }
}

function doNormalComputerMove(){
  turnOnThinking().then(()=>{
    let nextMove = computerMove(0,4,6);
    if (nextMove){
      completeMoveFromState([nextMove.from,nextMove.to])
    }
  });
}

function turnOnThinking(){
  return new Promise((resolve,reject)=>{
    thinking.classList.add('visible')
    thinkingInProg = true;
    window.requestAnimationFrame(resolve);
  });
}
//
let moveTreeG;
let lastDitchEffortAttempted = false;
function computerMove(boardIndex,depth,maxWidth){
  if (maxWidth === 0) {maxWidth = 1}
  let castle = null ;
  let previousOccupant = null;
  let hasPieceMoved = null;
  let enPassant = null;
  let orderedMoves,bestMove,moveTree;
  //create new board from current simulation 
  boards.push({state:[],rating:[]}); 
  boards[boardIndex+1].state = createSimulatedBoard(boards[boardIndex].state); //boardIndex
  
  //get object of all pieces to loop over 
  let piecesOnBoard = getPiecesOnBoard(boards[boardIndex+1]); //organize pieces on the simulated board into a split array
  
  //change the chess piece objects so they know what board to access. 
  changePieceBoardID(piecesOnBoard,boardIndex+1); //tell the pieces they are on a simulated board 

  //get all legal moves on the board 
  let ratedSimulatedMoves = checkAndRateAvailableMoves(piecesOnBoard,boardIndex+1);
  //make sure to use any available checkmate 
  let checkmates = ratedSimulatedMoves.filter(move=>move.checkmate);

  if (checkmates.length > 0 ){ 
    //always do a mate in 1
    bestMove = checkmates[0];
    moveTree = [{'move':bestMove,
               'winningMate':(computerPlayer === turn),
               'losingMate':!(computerPlayer === turn),
               'futureMoves':null}]
  } else { 
    //see what the difference is between each side 
    let ratingChangeArray =  getRatingChange(ratedSimulatedMoves);
    if (!turn){
      orderedMoves = ratingChangeArray.map((arr,i)=>[arr[1]-arr[0],i]).sort((a,b)=>b[0]-a[0]) //map the index to the rating difference, then sort by rating difference 
//       bestMoves = orderedMoves.filter(arr=>orderedMoves[0][0]-arr[0]<.25)
    } else {
      orderedMoves = ratingChangeArray.map((arr,i)=>[arr[1]-arr[0],i]).sort((a,b)=>a[0]-b[0]) //map the index to the rating difference, then sort by rating difference 
//       bestMoves = orderedMoves.filter(arr=>arr[0]-orderedMoves[0][0]<.25)
    }
    if (orderedMoves.length === 0){
      //if there are no moves available
      if (boards.length === 2) {

        boards.pop();
        return
      }
      moveTree = [{'move':bestMove,
                     'winningMate':false,
                     'losingMate':false,
                     'futureMoves':null}]
    } else {
      if (lastDitchEffortAttempted){
        width = ratedSimulatedMoves.length;
      } else {
        width = decideMovesWorthConsidering(); 
      }
      bestMove = ratedSimulatedMoves[orderedMoves[0][1]];
      bestMove.index = 0;
      moveTree = buildRecursionListTree(width,depth,bestMove); 
    }
  }

  boards.pop()

  if (boards.length === 1){ //if there is only one board, all moves have been simulated 
    if (bestMove.checkmate){ //mate in 1
      return bestMove
    }
    let chosenMove = evaluateFuturePositions(moveTree);
    return chosenMove
  } else {
    return moveTree
  }
  
  function buildRecursionListTree(width,depth,bestMove){
    let testTree = [];
    if (bestMove === undefined){ debugger }
    if (bestMove.checkmate) {
      testTree.push({'move':bestMove,
                     'winningMate':false,
                     'losingMate':false,
                     'futureMoves':null})
      if (bestMove.color) { testTree[testTree.length-1].losingMate = true }
      else { testTree[testTree.length-1].winningMate = true }
    } else if (depth === 0){
      testTree.push({'move':bestMove,
                     'winningMate':false,
                     'losingMate':false,
                     'futureMoves':undefined})
    } else {
//       if (f8count === 51) {debugger}
      for (let i=0;i<orderedMoves.length && i<width && i<maxWidth;i++){
        let testMove = ratedSimulatedMoves[orderedMoves[i][1]];
        simulateMove(testMove.from,testMove.to,boards[boardIndex+1]);
//         if (boards.length === 2) { debugger }
        oldMovesOutNewMovesIn(boardIndex+1);      
        testTree.push({
         'move':testMove,
         'winningMate':false,
         'losingMate':false,
         'futureMoves': computerMove (boardIndex+1,depth-1,maxWidth-1)
        });
        undoMove(testMove.from,testMove.to,boards[boardIndex+1]);
      }
    }
    return testTree
  }

  function decideMovesWorthConsidering(){
    //if any move is 10 better just do it or assume it will be done 
    //this may remove possibilties for queen sacrifices, but at the moment it is missing simple captures 
//     if (Math.abs(orderedMoves[0][0]-orderedMoves[1][0])>10) {
//       return 3} 
    let threshold = 15; //if the future moves are 5 under the best move just trim it there and dont look at all moves 
    let trimmedOrderedMoves = orderedMoves.filter(x=>(Math.abs(orderedMoves[0][0]-x[0]))<threshold);
    let width = trimmedOrderedMoves.length;
    return width
  }

  function evaluateFuturePositions(tree){
    let enemyFutureWorstOutcomeIndex;
    let moveIfMate = tree[0].move;

    if (tree.length === 1) { return moveIfMate} //jump the function if theres only one choice 

    checkForcedMates(tree); //see if all entries with this move have a following checkmate
    if (tree.some(move=>move.losingMate)) {
      tree = tree.filter(move=>!move.losingMate)
    }
    if(tree.length === 0){
      let lastDitchEffort
      if (!lastDitchEffortAttempted) {
        lastDitchEffortAttempted = true;
        lastDitchEffort = computerMove(0,2,1000)
      } 
      if (lastDitchEffort){
        return lastDitchEffort
      } else {
        return moveIfMate
      }
    } else if (tree.length === 1) { return moveIfMate }
    //look for a forced mate 
    let forcedMate = tree.find(move=>move.winningMate);
    if (forcedMate) { return forcedMate.move}
    
    let ratingTree = rateMoveTree(tree); //filter the tree so it is only ratings
    
    let lastMoves = []; //last evaluated moves in the tree 
    let currMove; //one of the moves that can be made this turn 
    collectFinalOutcomes(ratingTree,true) //builds last moves 
    if (lastMoves.length <= 1){
      enemyFutureWorstOutcomeIndex = 0;
    } else {
      //Best outcome assuming enemy moves guessed correctly (usually not)
      //finding the move that results in the lowest available best move for enemy after 2 moves 
      let assumedDepth = Math.max(...lastMoves.map(move=>move[1])) //how many moves have been evaluated 
      if (assumedDepth === 0) {
        return tree[0].move;
      }
      let bestEnemyOutcomes = [];
      let lastMoveAverages = [];
      //the last evaluated moves are the enemy moves. 
      //the goal is to find the position that is worst for the enemy 
      for (let i=0;i<=assumedDepth;i++){ 
        //select the best enemy outcome at the end of each considered move
        let lastMovesFromEachMove = lastMoves.filter(move=>move[1]===i); //last moves from each considered move 
        let sortedEnemyOutcomeThisMove = lastMovesFromEachMove.sort((a,b)=>(b[0]-a[0])); 
        bestEnemyOutcomes.push(sortedEnemyOutcomeThisMove[0]);
        
        //average the enemy outcomes at the end of each considered move
        let sum = 0;
        lastMovesFromEachMove.forEach(rating=>{
          if (rating[0] !== -1000) {sum += rating[0];}
        })
        lastMoveAverages.push([sum/lastMovesFromEachMove.length,i]);
      }
      bestEnemyOutcomes = bestEnemyOutcomes.sort((a,b)=>(a[0]-b[0]));
      lastMoveAverages = lastMoveAverages.sort((a,b)=>(a[0]-b[0]));

      viable_moves = getViableMoves(bestEnemyOutcomes,lastMoveAverages)

      let bestEnemyOutcomes_difference = bestEnemyOutcomes[1][0] - bestEnemyOutcomes[0][0];
      let lastMoveAverages_difference = lastMoveAverages[1][0] - lastMoveAverages[0][0];
      if (viable_moves.length>1){
        enemyFutureWorstOutcomeIndex = viable_moves[Math.floor(Math.random()*viable_moves.length)]
      } else if (bestEnemyOutcomes[0][1] === lastMoveAverages[0][1]){
        console.log('strong move')
        enemyFutureWorstOutcomeIndex = bestEnemyOutcomes[0][1];
      } else if (bestEnemyOutcomes_difference > 5) {
        if (bestEnemyOutcomes_difference > lastMoveAverages_difference){
          console.log('beo better')
          enemyFutureWorstOutcomeIndex = bestEnemyOutcomes[0][1];
        }
      } else if (lastMoveAverages_difference > 5) {
        console.log('lma better')
        enemyFutureWorstOutcomeIndex = lastMoveAverages[0][1];
      } else if (bestEnemyOutcomes[0][1] === lastMoveAverages[1][1]) {
        console.log('probably good')
        enemyFutureWorstOutcomeIndex = bestEnemyOutcomes[0][1];        
      } else if (bestEnemyOutcomes[1][1] === lastMoveAverages[0][1]){
        console.log('probably good')
        enemyFutureWorstOutcomeIndex = bestEnemyOutcomes[1][1]; 
      } else if (bestEnemyOutcomes[1][1] === lastMoveAverages[1][1]) {
        console.log('second agree')
        enemyFutureWorstOutcomeIndex = lastMoveAverages[1][1];  
      } else {
        if (bestEnemyOutcomes[0][1] === 0 || lastMoveAverages[0][1] == 0) { 
          console.log('best move this turn still holds')
          enemyFutureWorstOutcomeIndex = 0;
        } else {
          console.log('go with enemys worst outcome next move')
          let nextBestEnemyMoves = [];
          ratingTree.nextMovesRatings.forEach((move,i)=>{
            nextBestEnemyMoves.push([move.moveRating[0],i]);
          });
          nextBestEnemyMoves.sort((a,b)=>(a[0]-b[0]));
          enemyFutureWorstOutcomeIndex = nextBestEnemyMoves[0][1]
        }
        
      }
    }
    return tree[enemyFutureWorstOutcomeIndex].move;
    
    function getViableMoves(...moveSets){
      viable_moves = []
      moveSets.forEach(set=>{
        set = set.filter(rating=>rating[0] - set[0][0] < 1)
        set = set.map(x=>x[1]);
        viable_moves.push(set);
      })
      return arrayIntersection(viable_moves)      
    }

    function collectFinalOutcomes(tree, thisMove=false){
      if (tree.nextMovesRatings.some(move=>move.moveRating.length) > 0){ //if the next move has at least 1 rated move (meaning there are moves to check after this move )
        tree.nextMovesRatings.forEach((move,i)=>{
          if (thisMove) {currMove = i} //used to classify each move as a branch or subbranch of the original moveset 
          if (move.nextMovesRatings.length>0) { //if there are moves to classify after this one 

//             let movesAfterBestReply = getOnlyMax(move) //this is assuming what move the other player will make. maybe I should just check every move  
// //             if (movesAfterBestReply)
//                collectFinalOutcomes(movesAfterBestReply)

            for (let i=0;i<move.moveRating.length;i++){
              if (move.moveRating[i]-move.moveRating[0] < -5){
                move.nextMovesRatings.splice(i)
                break
              }
            }
          
            move.nextMovesRatings.forEach(nextMove=>{
              for (let i=0;i<nextMove.moveRating.length;i++){
                if (nextMove.moveRating[i]-nextMove.moveRating[0] > 5){
                  nextMove.nextMovesRatings.splice(i)
                  break
                }
              }
            });


            move.nextMovesRatings.forEach((move)=>{ //maybe dont save the move if the move follows a terrible enemy move. (assume they play well)
              collectFinalOutcomes(move);
            });


          }
        });
      } else { //if there are no more ratings
        lastMoves.push([tree.moveRating[0],currMove,tree.level]) //push the moverating resulting from this tree and the originalmove
//         if (tree.moveRating.length > 1) { debugger } //it should only be 1 move at the end, maybe not for checkmate 
      }
//       function getOnlyMax(move){ //find which move has the best outcome for the enemy
//         let highestRating = move.moveRating.sort((a,b)=>a[0]-b[0])[0] //find the highest rating 
//         let highestRatingIndex = move.moveRating.indexOf(highestRating) //get the index of this 
//         return move.nextMovesRatings[highestRatingIndex] //will always be index 0 but keeping it unless something is changed later 
//       }
    }

    //creates ratingrtree
    function rateMoveTree(tree,i=0){
      let tempArray = {'moveRating':[],'nextMovesRatings':[],'level':i};
      if (tree) {
        tree.forEach(branch=>{
          if (branch.move === undefined) {
            tempArray.moveRating.push(0)
          } else if (branch.move.rating){
            tempArray.moveRating.push(branch.move.rating[2]);
              tempArray.nextMovesRatings.push(rateMoveTree(branch.futureMoves,i+1));  
          } else {
            tempArray.moveRating.push(-1000);//should be avoided, probably checkmate or stalemate
          }
        });
      } 
      return tempArray
    }

    function checkForcedMates(tree){
      addCheckmatesUpTree(tree,'winningMate')
      addCheckmatesUpTree(tree,'losingMate')
      function addCheckmatesUpTree(tree,toBeChecked){
        if (tree.every(move=>!move.futureMoves)){
          return tree.every(move=>move[toBeChecked])
        } else {
          tree.forEach(move=>{
            if (move.futureMoves) {
              move[toBeChecked] = addCheckmatesUpTree(move.futureMoves,toBeChecked);
            }
          })
          return tree.every(move=>move[toBeChecked])
        }
      }
    }
  }
  
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

  function getRatingChange(ratedSimulatedMoves){
    let currWhiteRating = boards[0].rating[0];
    let currBlackRating = boards[0].rating[1];
    return ratedSimulatedMoves.map(simMove=>[simMove.rating[0], simMove.rating[1]]);//[simMove.rating[0]- currWhiteRating, simMove.rating[1] - currBlackRating]);
  }

  function checkAndRateAvailableMoves(piecesOnBoard,boardIndex){
    let toBeSimulatedMoves = collectCurrentMoves(piecesOnBoard);
    let checkmateFound = false;
//     clearAllLegalMoves(piecesOnBoard)
    for (let i=0;i<toBeSimulatedMoves.length;i++){
//       if (f8count === 52 && i === 8) {debugger}
      let move = toBeSimulatedMoves[i];
      simulateMove(move.from,move.to,boards[boardIndex]);
      checkmateFound = oldMovesOutNewMovesIn(boardIndex);
      if (checkmateFound) {
        move.checkmate = true
        undoMove(move.from,move.to,boards[boardIndex]);
        return toBeSimulatedMoves //if a checkmate is found there is no reason to consider other moves 
      }
      move.rating = boards[boardIndex].rating
      move.rating.push(move.rating[0]-move.rating[1])
      undoMove(move.from,move.to,boards[boardIndex]);
    };
    
    return toBeSimulatedMoves

    function collectCurrentMoves(piecesOnBoard){
      let movesList = [];
      piecesOnBoard[turn].forEach(piece=>{
        piece.action.legal.moves.forEach(move=>{
          movesList.push({'from':piece.rowCol,'to':move,'capture':false,'color':piece.color})
        })
        piece.action.legal.captures.forEach(capture=>{
          let capturedPiece = boards[piece.boardID].state[capture[0]][capture[1]];
          if (!capturedPiece){
            capturedPiece = boards[piece.boardID].state[capture[0]-piece.direction][capture[1]];
          }
          movesList.push({'from':piece.rowCol,'to':capture,'capture':capturedPiece,'color':piece.color})
        })
      });
      return movesList;
    }
  }

  function simulateMove(from,to,board){
    let piece = board.state[from[0]][from[1]];
    hasPieceMoved = piece.hasMoved;
    piece.hasMoved = true;
    previousOccupant = board.state[to[0]][to[1]];
    board.state[from[0]][from[1]] = null; //make move
    board.state[to[0]][to[1]] = piece;
    piece.rowCol = to;

    if (piece.isKing){
      castle = checkForCastle(from,to);
      if (castle){
//         toBeSimulatedMoves[moveIndex].castle = castle
        simulateMove(castle[0],castle[1],board)
        turn = !turn 
      }
    } else if (piece.constructor.name === 'Pawn'){
      if (!previousOccupant){ //(toBeSimulatedMoves[moveIndex].capture && !previousOccupant){
        enPassant = board.state[to[0]-piece.direction][[to[1]]];
        board.state[to[0]-piece.direction][[to[1]]] = null;
      }
    }
    moveHistory.push({move:[from,to,piece.constructor.name]})
    turn = !turn;
  }

  function undoMove (from,to,board){
    let piece = board.state[to[0]][to[1]];
    if (piece === null) { console.log('problem in "undoMove", the square that a piece is moving from is empty') }
    board.state[to[0]][to[1]] = previousOccupant; // undo move 
    board.state[from[0]][from[1]] = piece; 
    piece.rowCol = from;
    board.rating = 0;
    piece.hasMoved = hasPieceMoved;

    if (castle) {
      let tempMove = castle;
      castle = false;
      undoMove(tempMove[0],tempMove[1],board)
      turn = !turn
    } else if (enPassant){
      board.state[to[0]-piece.direction][[to[1]]] = enPassant;
    }
    turn = !turn;
    moveHistory.pop()
    castle = null ;
    previousOccupant = null;
    hasPieceMoved = null;
    enPassant = null;
  }

  function changePieceBoardID(piecesOnBoard,boardIndex){
    piecesOnBoard[true].forEach(piece=>{
      piece.boardID = boardIndex;
    })
    piecesOnBoard[false].forEach(piece=>{
      piece.boardID = boardIndex;
    })
  }
}

function checkWinOrDraw(){
  let piecesOnBoard = getPiecesOnBoard(boards[0])
  if (checkmateDisplayed(piecesOnBoard)){
    let kingOfTurn = piecesOnBoard[turn].find(piece=>piece.isKing)
    if (kingOfTurn.attackedBy.length > 0){
      winner();  
    } else {
      draw(); 
    }
  } else {
    winnerBool = false;
  }
  if (drawBool) {
    console.log("draw")
  }
}

function populateBoard(){
  //go to homeSquare
  movePromises = [];
  let[strayP1,strayP2] = [Array.from(p1pieces),Array.from(p2pieces)];
  for (let i = 0; i < 2; i++) {
    assignPiece(i, 'player2');
  }
  for (let i = 6; i < 8; i++) {
    assignPiece(i, 'player1');
  }
  return movePromises
  function assignPiece(count, player) {
    var piece;

    for (var j = 0; j < 8; j++) {
      var square = getSquare(count,j);
      
      if (player === 'player1') {
        piece = strayP1.pop();
      } else {
        piece = strayP2.pop();
      }
      if(pieceMap.get(piece)){
        movePromises.push(movePiece(piece, pieceMap.get(piece).homeSquare, speedFactor = 30));
      } else {
        movePromises.push(movePiece(piece, square, speedFactor = 30)) 
      }
    }
  }
}

//physically moving pieces
// let prevHeldPiece = [];
function dragElement(elmnt) {
  var pos1 = 0,
      pos2 = 0,
      pos3 = 0,
      pos4 = 0;
  var startParent;
  elmnt.onmousedown = dragMouseDown;
  function dragMouseDown(e) {
    e = e || window.event;
    e.stopPropagation();
    e.preventDefault();

    if (delOnClick){
      stackPiece(elmnt)
      return
    }
    let elmntBounds, leftBoundElmnt,topBoundElmnt;
    let squareBounds, leftBoundSquare;
    let rowBounds,leftBoundRow;
    
//     prevHeldPiece = [elmnt,elmnt.parentElement,pieceArea.childElementCount];
    let pieceInGraveyard = (elmnt.parentElement.id == 'p1graveyard' || elmnt.parentElement.id == 'p2graveyard')
    if (trblesht) {} else if (isp1(elmnt) !== turn || midPromotion || displaySimulateIndex !== 0
    || pieceInGraveyard || winnerBool || undoneMoves.length>0 || pieceArea.childElementCount > 0
    ||  (playingComputer && !isp1(elmnt)) || thinkingInProg) {
      return
    }
    let clickedSqaure = document.elementsFromPoint(e.clientX, e.clientY).find(item=>item.classList.contains('square'))
    if (clickedSqaure){
      if (!clickedSqaure.children[0].classList.contains('hidden')){
        completeMove(activePiece.parentElement,activePiece,clickedSqaure)
        endDrag(elmnt);
      } 
    }

    if (activePiece !== elmnt){ //if it is a new piece, hide old shown moves 
      hideAvailableMoveIcons(); 
    }
    activePiece = elmnt;
    pieceMap.get(elmnt).displayMoves(); //then display the moves 
    // get the mouse cursor position at startup:

    startParent = elmnt.parentElement;
    handleSquareHighlightsClick(elmnt);

    if (!onMobile) {

    pos1 = e.clientX;
    pos2 = e.clientY;
    elmntBounds = elmnt.getBoundingClientRect();
    leftBoundElmnt = elmntBounds.x;
    topBoundElmnt = elmntBounds.y;
    squareBounds = elmnt.parentElement.getBoundingClientRect();
    leftBoundSquare = squareBounds.x;
    
    rowBounds = elmnt.parentElement.parentElement.getBoundingClientRect();
    leftBoundRow = rowBounds.x;

    let rowCol = getRowCol(elmnt.parentElement);
    let newX = pos1 - leftBoundElmnt + leftBoundSquare - leftBoundRow;
    let newY = pos2- window.scrollY - topBoundElmnt + elmntBounds.height*rowCol[0];

      document.onmouseup = closeDragElement;
      handToPieceArea(elmnt,newX,newY,false);
      document.onmousemove = elementDrag
    }
    function elementDrag(e) {
      e = e || window.event;
      e.preventDefault();
      // calculate the new cursor position:
//       console.log('dragging element')
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;    
      elmnt.style.left = (pos3 - leftBoundElmnt + leftBoundSquare - leftBoundRow -20) + 'px';
      elmnt.style.top = (pos4 - topBoundElmnt + elmntBounds.height*rowCol[0]- 20) + 'px';
      handleSquareHighlightsDrag(document.elementsFromPoint(pos3,pos4).find(div=>div.classList.contains('square')));
    }
  }

  function closeDragElement(e) {
    //stop moving when mouse button is released:
//     let squareInfo = document.elementsFromPoint(pos3, pos4);
    let squareInfo = document.elementsFromPoint(e.clientX, e.clientY);
    let square = squareInfo.find(item=>item.classList.contains('square'));

    if (trblesht) {
        square.appendChild(elmnt);
        endDrag(elmnt);
    } else {
      try {
        if (!square.children[0].classList.contains('hidden')) {
          endDrag(elmnt);
          completeMove(startParent,elmnt,square)
        } else {
          console.log('same square')
          startParent.appendChild(elmnt);
          endDrag(elmnt,startParent === square);
        }
      } catch (error) {
        console.log(error)
        startParent.appendChild(elmnt);
        endDrag(elmnt);
      }
    }
  }

  function endDrag(piece,keepIcons=false){
    elmnt.style.top = 'auto';
    elmnt.style.left = 'auto';
    document.onmouseup = null;
    document.onmousemove = null;

    if (keepIcons) {return}
    hideAvailableMoveIcons();
    console.log('drag ended')
  }
}

function hideAvailableMoveIcons(){
  availMoveIcons.forEach(icon=>{
    icon.style.zIndex = '0';
    icon.classList.add('hidden');
  });
}
  

let canAnimate = true
function completeMoveFromState(move,shouldUpdate=true){
  return new Promise((resolve,reject)=>{
    let startParent = boardNode.children[move[0][0]].children[move[0][1]];
    let square = boardNode.children[move[1][0]].children[move[1][1]];
    let piece = startParent.children[1];
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
          promotionSelected(undefined,computerPromotion = true);
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
      if (square.children.length>2){
        capturedPiece = pieceMap.get(square.children[1]);   
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

let highlightedSquaresMove = [];
function handleSquareHighlightsMove(startParent,square){
  unhighlightSquare(highlightedSquaresMove[0]);
  unhighlightSquare(highlightedSquaresMove[1]);
  highlightSquare(startParent);
  highlightSquare(square);
  highlightedSquaresMove = [startParent,square];
}

let highlightedSquaresClick = {true:[],false:[]}
function handleSquareHighlightsClick(piece){
  let square = piece.parentElement;
  unhighlightSquare(highlightedSquaresClick[turn][0]);
  highlightSquare(square);
  highlightedSquaresClick[turn][0] = square
}

let highlightedSquaresDrag;
function handleSquareHighlightsDrag(square){
  unhighlightSquare(highlightedSquaresDrag);
  highlightSquare(square);
  highlightedSquaresDrag = square;
}

function unhighlightAllSquares(){
  for (let i=0;i<8;i++){
    for(let j=0;j<8;j++){
      unhighlightSquare(boardNode.children[i].children[j])
    }
  }

}

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

function promotionSelected(piece = null, computerPromotion = false){
  midPromotion = false
  let newPieceType, promotedPiece;
  
  if (computerPromotion){
    newPieceType = "queen"
  } else {
    promotionBox.style.visibility = 'hidden';
    newPieceType = piece.classList[1].substring(2);
  }

  let rowCol = moveHistory[moveHistory.length-1].move[1];
  let originalPawn = boards[0].state[rowCol[0]][rowCol[1]];
  let pieceNode = originalPawn.piece
  
  pieceNode.classList.remove('pawn');
  pieceNode.classList.add(newPieceType);

  if (newPieceType === "queen") {
    promotedPiece = new Queen(pieceNode); 
  } else if (newPieceType === "knight") {
    promotedPiece = new Knight(pieceNode);     
  } else if (newPieceType === "rook") {
    promotedPiece = new Rook(pieceNode);   
  } else if (newPieceType === "bishop") {
    promotedPiece = new Bishop(pieceNode); 
  }
  promotedPiece.rowCol = rowCol;
  promotedPiece.homeSquare = originalPawn.homeSquare;
  promotedPiece.promoted = true;
  boards[0].state[rowCol[0]][rowCol[1]] = promotedPiece;
  
  swapTurn(0)
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

function stackPiece(piece) {
  console.log('try to capture piece')
  return new Promise((resolve,reject)=>{
    let graveyard;
    if (isp1(piece)) {
      graveyard = p1graveyard;
    } else {
      graveyard = p2graveyard;
    }
    movePiece(piece, graveyard).then(()=>{
      console.log('piece captured')
      resolve()
    });
  })
}

graveyardOffsets = {true:{},false:{}}
function movePiece(piece,loc,speedFactor=10){
  return new Promise((resolve,reject)=>{
    if (piece.parentElement.id === "piece-area"){
      changePieceParent(piece,loc);
      window.requestAnimationFrame(resolve);
      return
    }
    let locPos = loc.getBoundingClientRect();
    let piecePos = piece.getBoundingClientRect();
    let dy;
    let dx = locPos.left - piecePos.left;
    let pieceTop;
    if (loc.id === 'p1graveyard' || loc.id === 'p2graveyard') {
      let side = isp1(piece)
      if (graveyardOffsets[side][piece.classList] === undefined){
        graveyardOffsets[side][piece.classList] = {};
        if (side) {
          graveyardOffsets[side][piece.classList]['offset'] = Object.keys(graveyardOffsets[side]).length -1
        } else {
          graveyardOffsets[side][piece.classList]['offset'] = -Object.keys(graveyardOffsets[side]).length + 1
        }
        graveyardOffsets[side][piece.classList]['count'] = 0;
      } else {
        graveyardOffsets[side][piece.classList]['count'] += 1
      }
      let graveyardY = (locPos.top + locPos.height / 2)// - loc.childElementCount * 5
      dy = graveyardY - piecePos.top// - (1 + loc.childElementCount * 5);
      pieceTop = 40 * graveyardOffsets[side][piece.classList]['offset'] -graveyardOffsets[side][piece.classList]['count'] * 5// + 'px'
      dy = dy + pieceTop;
      pieceTop = pieceTop + 'px'
    } else {
      dy = locPos.top - piecePos.top
      pieceTop = 'auto'
    }

    //set piece parent to pieceArea so that it is at the top layer, then change the top and left so the piece
    //is visually in the same position it was inside the square.
    let[posx,posy] = handToPieceArea(piece,piece.parentElement.offsetLeft,piece.parentElement.offsetTop);
    let count = 0;
//     step();
    window.requestAnimationFrame(step);
    function step(){
      if (count === speedFactor) {
        window.requestAnimationFrame(()=>{
          loc.appendChild(piece);
          piece.style.top = pieceTop;
          piece.style.left = 'auto';
          resolve();
        });
      } else {
        posx += dx / speedFactor;
        posy += dy / speedFactor;
        piece.style.top = posy + 'px';
        piece.style.left = posx + 'px';
        count++;
        window.requestAnimationFrame(step);
      }
    }
  });
  
  function changePieceParent(piece,square){
    square.appendChild(piece);
    if (square !== pieceArea){
      square.children[1].style.zIndex = '1';
      square.children[0].style.zIndex = '0';
    }  
  } 
}

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
    console.log (moveHistory,undoneMoves);
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
    console.log (moveHistory,undoneMoves);
  }
}

//functional tools

function arrayIntersection(arr){
  //takes an array of arrays
  let intersections = []
  for (let i=0;i<arr.length-1;i++){ //for each array except the last 
    for (let j=0;j<arr[i].length;j++){ //for each item in that array 
      let inAllArr = false;
      let item = arr[i][j]
      for (let k=0;k<arr.length;k++){ //for each other arr
        if (arr[k].indexOf(item) > -1){ // check if this item is in each following array
          inAllArr = true;
        } else {
          inAllArr = false;
          break
        }
      }
      if (inAllArr && intersections.indexOf(item) === -1){ intersections.push(item)}
    }
  }
  return intersections
}


function handToPieceArea(piece,left,top,animationFrame = true){
  let pieceParentLeft = piece.parentElement.offsetLeft
  let pieceParentTop = piece.parentElement.offsetTop

  if (piece.parentElement.id.substring(2) === 'graveyard'){
    pieceParentTop -= 10;
  }
  if (animationFrame){
    window.requestAnimationFrame(()=>{
      pieceArea.appendChild(piece);
      piece.style.left = left + - 20 + 'px';
      piece.style.top = top + window.scrollY - 20 + 'px';
    }); 
  } else {
    pieceArea.appendChild(piece);
    piece.style.left = left + - 20 + 'px';
    piece.style.top = top + window.scrollY - 20 + 'px';
    console.log('piece in piece area')
  }
  return [pieceParentLeft, pieceParentTop];
}

function isp1(element){
  try{
    return element.classList.contains('p1piece')  
  } catch {
    return undefined
  }
}

function getRowCol(square) {
  //runs through each of the row and add the found row
  var rowCol = [];
  for (var i = 0; i < boardNode.childElementCount; i++) {
    if (square.parentElement === board.children[i]) {
      rowCol.push(i);
        break
    }
  }
  for (var i = 0; i < boardNode.childElementCount; i++) {
    if (square === getSquare(rowCol[0],i)) {
      rowCol.push(i);
      break
    }
  }
  return rowCol;
}

function arraysEqual(arr1,arr2){
  if (arr.length !== arr2.length){ return false }
  for (let i = arr1.length; i--;){
    if (arr1[i] !==arr2[i]){
      return false
    }
  }
  return true
}

function randomIntBetween(min,max){
  return Math.floor(Math.random()*(max-min+1)+min)
}


function getSquare(row,col){
  try{
    return board.children[row].children[col];
  } catch(error) {
    return undefined
  }
}

//Winner logic

let checkWinner = ()=>{
  if (turn) {
    return !Array.from(p2pieces).some(piece=>piece.parentElement.id==='');
  } else {
    return !Array.from(p1pieces).some(piece=>piece.parentElement.id==='');
  }
}

function checkmateDisplayed(piecesOnBoard){
  oldMovesOutNewMovesIn(0)
  let futureMoves = piecesOnBoard[turn].filter(piece=>{ 
    let futureMoves = piece.action.legal.moves.length > 0;
    let futureCaptures = piece.action.legal.captures.length > 0;
    return (futureMoves || futureCaptures)
  });
  if (futureMoves.length === 0){
    return true
  }
}

function draw(){
  clearWinner();
  drawNode.style.visibility = 'visible';
  drawNode.style.color = 'black';
  winnerBool = true
}

function winner(player = turn) {
    clearWinner();
    winnerBool = true;

    if (!player === computerPlayer) {
        p2s.innerText = Number(p2s.innerText) + 1;
        winner2.style.visibility = 'visible';
//         winner2.style.backgroundColor = ;//p2color.value;
    } else {
        p1s.innerText = Number(p1s.innerText) + 1;
        winner1.style.visibility = 'visible';
//         winner1.style.backgroundColor = 'white';//p1color.value;
//         winner1.style.color = 'black';
    }
//     newGame.innerText = 'Play Again';
    thinking.classList.remove('visible');
    thinkingInProg = false;
}


//Coloring/styling

function highlightSquare(square){
  if (!square || !square.classList.contains("square")){ return }
  if (square.classList.contains("dark")){
    square.style.backgroundColor = "rgb(210, 80, 50)";
  } else {
    square.style.backgroundColor = "rgb(255, 200, 130)";
  }
}

function unhighlightSquare(square){
  if (!square || !square.classList.contains("square")){ return }
  if (square.classList.contains("dark")){
    square.style.backgroundColor = "rgb(130, 65, 0)";
  } else {
    square.style.backgroundColor = "rgb(219, 183, 183)";
  }
}


function colorPlayerIcons(){
  clearIcons();
  let p1color,p2color;
  if (firstMove) {
    p1color = 'white';
    p2color = 'black';
  } else {
    p2color = 'white';
    p1color = 'black';
  }
  if (turn) {
    p1icon.style.backgroundColor = p1color;
    p1icon.style.borderColor = 'black';
    document.querySelector('#ff-name').innerText = 'Player 1'
  } else {

    p2icon.style.backgroundColor = p2color;
    p2icon.style.borderColor = 'black';
    document.querySelector('#ff-name').innerText = 'Player 2'
    }
}

function clearIcons() {
  p1icon.style.backgroundColor = '#ffffff';
  p1icon.style.borderColor = '#ffffff';
  p2icon.style.backgroundColor = '#ffffff';
  p2icon.style.borderColor = '#ffffff';
}

function setMoveIcons() {
  clearIcons();
  if (turn) {
    p1icon.style.backgroundColor = 'white'//p1color.value;
    p1icon.style.borderColor = 'black';
  } else {
    p2icon.style.backgroundColor = 'black';//p2color.value;
    p2icon.style.borderColor = 'black';
  }
}

function clearWinner() {
  //restyle anything so it looks like it does before a win 
  winner1.style.visibility = 'hidden';
  winner2.style.visibility = 'hidden';
  drawNode.style.visibility = 'hidden';
  clearIcons();
  winner1.style.backgroundColor = '#ffffff';
  winner2.style.backgroundColor = '#ffffff';
  winnerBool = false;
}

function callFuncIfNotThinking(func){
  if (!thinkingInProg){
    func()
  }
}
function init() {
  //for (i = 0; i < 8; i++) {
  //  getSquare(i,0).style.borderLeft = '1px solid black';
  //  getSquare(i,7).style.borderRight = '3px solid black';
  //}
  //document.querySelectorAll('.gameRow')[7].style.borderBottom = '3px solid black';
  //document.querySelectorAll('.gameRow')[0].style.borderTop = '1px solid black';

  for (i = 0; i < p1pieces.length; i++) {
    dragElement(p1pieces[i]);
    dragElement(p2pieces[i]);
  }

  promotionPieces.forEach(piece=>{
    piece.addEventListener('click',()=>{
      promotionSelected(piece);
    })
  })

//   document.addEventListener('click', );
  document.addEventListener('click', (e)=>{
    let clickedSqaure = document.elementsFromPoint(e.clientX, e.clientY).find(item=>item.classList.contains('square'))
    if (clickedSqaure === undefined || clickedSqaure.children[1] === undefined){
      hideAvailableMoveIcons()
      console.log('icons hidden')
//       handleSquareHighlightsClick(clickedSqaure.children[1]);
    }
  });
  reset.addEventListener('click', callFuncIfNotThinking.bind(null,resetAll));
  newGameButton.addEventListener('click', callFuncIfNotThinking.bind(null,newMatch));
  toggleComputer.addEventListener('click', callFuncIfNotThinking.bind(null,toggleComputerPlayer));
  toPrevMove.addEventListener('click',showPrevMove);
  toNextMove.addEventListener('click',showNextMove);
  
  function toggleComputerPlayer(){
    playingComputer = !playingComputer;
    if (toggleComputer.innerText.indexOf('Off') > 0){
      toggleComputer.innerText = 'Turn Computer On';
    } else {
      changeToggleText().then(()=>{
        window.requestAnimationFrame(()=>{
          if (!turn) {
            doNormalComputerMove();
          }
        });
      });
    }
  }
  ffyes.addEventListener('mousedown', (event)=>{
    winner();
//     forfeit.style.backgroundColor = newGameButton.style.backgroundColor;
    forfeit.classList.remove('forfeit-color')
    forfeit.classList.add('new-game-color')
    forfeit.innerText = 'Play Again';
  });
  forfeitBanner.addEventListener('mousedown', function(event){
    this.classList.add('hidden');
  });
  forfeit.addEventListener('mousedown', function(event){
    if (winnerBool || drawBool){
      newMatch();
    } else {
      forfeitBanner.classList.remove('hidden'); 
    }
  });

  toggleFirst.addEventListener('click', callFuncIfNotThinking.bind(null,()=>{
    flipKingAndQueen();
    firstMove = !firstMove;
    switchSides();
    newMatch();
  }));
  resetAll();
  createPieceLists();
  board.addEventListener('click',(e)=>{
    console.log('board clicked')
    let clickedSqaure = document.elementsFromPoint(e.clientX, e.clientY).find(item=>item.classList.contains('square'))
    if (!clickedSqaure.children[0].classList.contains('hidden')){
      console.log('click was a legal move')
      completeMove(activePiece.parentElement,activePiece,clickedSqaure)
      availMoveIcons.forEach(icon=>{
        icon.style.zIndex = '0';
        icon.classList.add('hidden');
      });
    }  
  })
}

function changeToggleText(){
  return new Promise((resolve,reject)=>{
    toggleComputer.innerText = 'Turn Computer Off'; 
    window.requestAnimationFrame(resolve);
  });
}

function averagePerformanceTrack(){
  let sum = 0;
  let averages = {true:[],false:[]}
  Object.keys(performanceTrack).forEach(side=>{
    performanceTrack[side].forEach(time=>{
      sum += time;
    })
    averages[side] = sum/performanceTrack[side].length
  });
  console.log(averages);
}

function flipKingAndQueen(){
  let king,kingNode,queen,queenNode,spot1;
  [p1pieces,p2pieces].forEach(side=>{
    queenNode = Array.from(side).find(piece=>piece.classList.contains('queen'));
    kingNode = Array.from(side).find(piece=>piece.classList.contains('king'));
    queen = pieceMap.get(queenNode)
    king = pieceMap.get(kingNode)
    queen.homeSquare.appendChild(kingNode);
    king.homeSquare.appendChild(queenNode);
    king.homeSquare = kingNode.parentElement;
    queen.homeSquare = queenNode.parentElement;
    
  });
}


//troubleshooting

let trblesht = false;
function freeMove() {
  trblesht = !trblesht
  return trblesht
}

let delOnClick = false;
function wrath(){
  delOnClick = !delOnClick;
  return delOnClick
}

// let ratedMoveLog = [];
// let prevmove;
let displaySimulateIndex = 0;
// let prevShownRatedMove;

// function simulateMoveOnDisplay(index, moves = ratedMoveLog){

//   if (prevShownRatedMove === undefined) { 
//     prevShownRatedMove = ratedMoveLog[ratedMoveLog[ratedMoveLog.length-1].index];
//   }

//   undoBoardMove(prevShownRatedMove).then(()=>{
//     demoMove(index)
//   })

//   function demoMove(index){
//     let move = moves[index]
//     if (move.capture){
//       let startParent = boardNode.children[move.move[0][0]].children[move.move[0][1]]
//       let p = startParent.lastElementChild;
//       let sq = boardNode.children[move.move[1][0]].children[move.move[1][1]];
//       completeMove(startParent,p,sq,false).then(()=>{
//         canAnimate = false
//         startParent = boardNode.children[move.capture.rowCol[0]].children[move.capture.rowCol[1]];
//         p = startParent.children[1]
//         sq = move.capture.color ? p1graveyard : p2graveyard;
//         completeMove(startParent,p,sq,false).then(()=>{canAnimate = true;});
//       });
//     } else if (move.castle){
//       completeMoveFromState(move.move,false);
//       completeMoveFromState(move.castle,false).then(()=>{canAnimate = true;});
//     } else {
//       completeMoveFromState(move.move,false).then(()=>{canAnimate = true;});
//     }
//     prevShownRatedMove = move;
//     console.log('--------------------------------------------',index,'--------------------------------------------------');
//     console.log('white: ',ratedMoveLog[index].posStrength[true], 'sum: ',ratedMoveLog[index].rating[0]);
//     console.log('black: ',ratedMoveLog[index].posStrength[false],'sum: ',ratedMoveLog[index].rating[1]); 
//     jumpToSim.value = index
//   }

//   function undoBoardMove(move){
//     return new Promise((resolve,reject)=>{
//       completeMoveFromState([move.move[1],move.move[0]],false).then(()=>{
//         if (move.capture){
//           canAnimate = false;
//           let startParent = move.capture.color ? p1graveyard : p2graveyard;
//           let p = startParent.lastElementChild;
//           let sq = boardNode.children[move.capture.rowCol[0]].children[move.capture.rowCol[1]];
//           completeMove(startParent,p,sq,false).then(()=>{
//             resolve();
//           });
//         } else if (move.castle){
//           canAnimate = false
//           completeMoveFromState([move.castle[1],move.castle[0]],false).then(()=>{
//             resolve();
//           });
//         } else {
//           resolve();
//         }
//       });
//     });
//   }

// }

// function showPrevSim(){
//   if (!canAnimate || undoneMoves.length > 0) { return }
//   canAnimate = false
//   displaySimulateIndex--
//   if (displaySimulateIndex < 0) {
//     displaySimulateIndex = 0 
//   }
//   simulateMoveOnDisplay(displaySimulateIndex)
// }

// function showNextSim(){
//   if (!canAnimate || undoneMoves.length > 0) { return }
//   canAnimate = false
//   displaySimulateIndex++
//   if (displaySimulateIndex >= ratedMoveLog.length-2) {
//     displaySimulateIndex = ratedMoveLog.length-2;
//   }
//   simulateMoveOnDisplay(displaySimulateIndex)
// }
// function jumpToEnteredNumber(){
//   let val = jumpToSim.value;
//   jumpToSim.value = ''
//   if (val < 0) {
//     val = 0
//   }

//   if (val >= ratedMoveLog.length-2) {
//     val = ratedMoveLog.length-2
//   }
//   displaySimulateIndex = parseInt(val);
//   simulateMoveOnDisplay(val);
// }

function mobileCheck() {
  var check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};


function resetDisplayedToShown(){
  Array.from(boardNode.children).forEach((row,i)=>{
    Array.from(row.children).forEach((square,j)=>{
      let piece = square.children[1]
      boards[0].state[i][j] = makeClassPieceFromNodePiece(piece,i,j)
    });
  });
  undoneMoves = [];
  function makeClassPieceFromNodePiece(piece,i,j){
    if (piece === undefined){return null}
    let classPiece = pieceMap.get(piece)
    classPiece.rowCol = [i,j]
    classPiece.clearAllLegalMoves
    classPiece.isCaptured=false
    let homeSquare = getRowCol(classPiece.homeSquare)
    if (classPiece.rowCol[0] === homeSquare[0] && classPiece.rowCol[1] === homeSquare[1]){
      classPiece.hasMoved = false;
    }
    return classPiece
  }
}

function pickUpFromCurrentPosition(){
  resetDisplayedToShown();
  oldMovesOutNewMovesIn(0);
}

function addCoords() {
  for (let i = 0;i<8;i++){
    for (let j = 0;j<8;j++){
      let tempSpan = document.createElement('span')
      boardNode.children[i].children[j].appendChild(tempSpan)
      tempSpan.textContent = i + ',' + j
      tempSpan.classList.add('coords')
    }
  }
}

init();
// addCoords();
// freeMove();
