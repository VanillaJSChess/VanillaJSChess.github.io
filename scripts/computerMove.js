
function doNormalComputerMove(){
  turnOnThinking().then(()=>{
    let nextMove = computerMove(0,4,6);
    if (nextMove){
      completeMoveFromState([nextMove.from,nextMove.to])
    }
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
        //console.log('strong move')
        enemyFutureWorstOutcomeIndex = bestEnemyOutcomes[0][1];
      } else if (bestEnemyOutcomes_difference > 5) {
        if (bestEnemyOutcomes_difference > lastMoveAverages_difference){
          //console.log('beo better')
          enemyFutureWorstOutcomeIndex = bestEnemyOutcomes[0][1];
        }
      } else if (lastMoveAverages_difference > 5) {
        //console.log('lma better')
        enemyFutureWorstOutcomeIndex = lastMoveAverages[0][1];
      } else if (bestEnemyOutcomes[0][1] === lastMoveAverages[1][1]) {
        //console.log('probably good')
        enemyFutureWorstOutcomeIndex = bestEnemyOutcomes[0][1];        
      } else if (bestEnemyOutcomes[1][1] === lastMoveAverages[0][1]){
        //console.log('probably good')
        enemyFutureWorstOutcomeIndex = bestEnemyOutcomes[1][1]; 
      } else if (bestEnemyOutcomes[1][1] === lastMoveAverages[1][1]) {
        //console.log('second agree')
        enemyFutureWorstOutcomeIndex = lastMoveAverages[1][1];  
      } else {
        if (bestEnemyOutcomes[0][1] === 0 || lastMoveAverages[0][1] == 0) { 
          //console.log('best move this turn still holds')
          enemyFutureWorstOutcomeIndex = 0;
        } else {
          //console.log('go with enemys worst outcome next move')
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
      moveSets = moveSets.filter(set=>set)
      moveSets.forEach(set=>{
        set = set.filter(rating=>{ if (rating){return (rating[0] - set[0][0] < 1)}})
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

    //creates ratingrtree` 
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
    //if (piece === null) { console.log('problem in "undoMove", the square that a piece is moving from is empty') }
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