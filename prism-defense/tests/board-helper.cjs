async function clickCell(board,x,y,verticalOffset=0){
 const box=await board.boundingBox();
 // Fixed 2:1 diamond layout, independently specified for browser interaction.
 await board.click({position:{x:(234+(x-y)*18)/576*box.width,y:(54+(x+y+1)*9+verticalOffset)/384*box.height}});
}
module.exports={clickCell};
