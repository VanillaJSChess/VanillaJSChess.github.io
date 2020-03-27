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