//Coloring/styling

function assignBorder(good,lastMove){
  let to = lastMove.move[1];
  if (good) { 
    let toSquare = boardNode.children[to[0]].children[to[1]];
    toSquare.classList.add('correct')
  } else {
    let toSquare = boardNode.children[to[0]].children[to[1]];
    toSquare.classList.add('incorrect')
  }
}

function highlightSquare(square){
  if (!square || !square.classList.contains("square")){ return }
  if (square.classList.contains("dark")){
    square.style.backgroundColor = "rgb(180, 90, 70)";
  } else {
    square.style.backgroundColor = "rgb(255, 210, 150)";
  }
}

function unhighlightSquare(square){
  if (!square || !square.classList.contains("square")){ return }
  if (square.classList.contains("dark")){
    square.style.backgroundColor = "rgb(130, 65, 0)";
  } else {
    square.style.backgroundColor = "rgb(219, 183, 183)";
  }
  square.classList.remove('correct')
  square.classList.remove('incorrect')
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
    ////revamp
//     p1icon.style.visibility = 'visible';
//     ffName.innerText = 'Player 1 Forfeit?'
  } else {
    ////revamp
    
//       p2icon.style.visibility = 'visible';
//       ffName.innerText = 'Player 2 Forfeit?'
  }
}

function clearIcons() {
  ////revamp
//     p1icon.style.visibility = 'hidden';
//     p2icon.style.visibility = 'hidden'
}

function setMoveIcons() {
  clearIcons();
  if (turn) {
    ////revamp
//     p1icon.style.visibility = 'visible';
  } else {
//     p2icon.style.visibility = 'visible';
  }
}

function clearWinner() {
  //restyle anything so it looks like it does before a win 
  ////revamp
//   winner1.style.visibility = 'hidden';
//   winner2.style.visibility = 'hidden';
//   drawNode.style.visibility = 'hidden';
//   clearIcons();
//   winner1.style.backgroundColor = '#ffffff';
//   winner2.style.backgroundColor = '#ffffff';
  winnerBool = false;
}

function changeToggleText(){
  return new Promise((resolve,reject)=>{
    toggleComputer.innerText = 'Turn Computer Off'; 
    window.requestAnimationFrame(resolve);
  });
}

function turnOnThinking(){
  return new Promise((resolve,reject)=>{
    thinking.classList.add('visible')
    thinkingInProg = true;
    window.requestAnimationFrame(resolve);
  });
}

function hideAvailableMoveIcons(){
  availMoveIcons.forEach(icon=>{
    icon.style.zIndex = '0';
    icon.classList.add('hidden');
  });
}