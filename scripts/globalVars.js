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
png = document.querySelector('#png'),
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
const onMobile = mobileCheck();
let boards = [{state:[],rating:[]}] //hols displayed and all simulated moves 
let moveHistory = []; //lists all prev moves with some details 
let pieceMap = new Map();//connects the piece nodes to the classes



function mobileCheck() {
  var check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};
