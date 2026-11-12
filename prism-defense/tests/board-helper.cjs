async function clickCell(board,x,y,verticalOffset=0){
 const box=await board.boundingBox();
 const camera=await board.evaluate(e=>({zoom:Number(e.dataset.zoom)||1,x:Number(e.dataset.panX)||0,y:Number(e.dataset.panY)||0}));
 // Fixed 2:1 diamond layout, independently specified for browser interaction.
 await board.click({position:{x:((288+(x-y)*15-288)*camera.zoom+288+camera.x)/576*box.width,y:((54+(x+y+1)*7.5+verticalOffset-192)*camera.zoom+192+camera.y)/384*box.height}});
}
module.exports={clickCell};
