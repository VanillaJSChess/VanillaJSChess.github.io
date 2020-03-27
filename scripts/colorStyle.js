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
    p1icon.style.visibility = 'visible';
    document.querySelector('#ff-name').innerText = 'Player 1'
  } else {
    p2icon.style.visibility = 'visible';
    document.querySelector('#ff-name').innerText = 'Player 2'
    }
}

function clearIcons() {
    p1icon.style.visibility = 'hidden';
    p2icon.style.visibility = 'hidden'
}

function setMoveIcons() {
  clearIcons();
  if (turn) {
    p1icon.style.visibility = 'visible';
  } else {
    p2icon.style.visibility = 'visible';
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