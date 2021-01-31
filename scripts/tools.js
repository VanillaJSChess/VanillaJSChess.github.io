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
  let squareWidth = document.querySelector('.square').offsetWidth;
  if (piece.parentElement.id.substring(2) === 'graveyard'){
    pieceParentTop -= 10;
  }
  if (animationFrame){
    window.requestAnimationFrame(offsetPiece); 
  } else {
    offsetPiece();
  }
  return [pieceParentLeft, pieceParentTop];

  function offsetPiece(){
      pieceArea.appendChild(piece);
      piece.style.left = left + - squareWidth/2 + 'px';
      piece.style.top = top + window.scrollY - squareWidth/2 + 'px';
  }
}

function isp1(element){
  try{
    return element.classList.contains('p1piece')  
  } catch (err) {
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

function getHomeSquares(){
  //can add a boolean to check if homeSquares have been set
  //problem is they cant be set until after the init or they must be hard coded
  Array.from(pieceMap.values()).forEach(piece=>{
    piece.getHomeSquare();
  });
}
