const {expect}=require('@playwright/test');

// Read the source alpha pixels independently of the stored icon crop metadata.
// This catches a correctly centred SVG box whose visible drawing is still off-centre.
async function checkSkillButtons(page){
 const results=await page.evaluate(async()=>{
  const atlas=new Image();atlas.src='/art/research-icons-flat-v3.png';await atlas.decode();
  const canvas=document.createElement('canvas');canvas.width=atlas.width;canvas.height=atlas.height;
  const ctx=canvas.getContext('2d');ctx.drawImage(atlas,0,0);const rgba=ctx.getImageData(0,0,atlas.width,atlas.height).data;
  return [...document.querySelectorAll('#research-tree .node')].map(button=>{
   const icon=button.querySelector('.skill-icon'),hex=button.querySelector('.skill-hex'),vb=icon.viewBox.baseVal;
   let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
   for(let y=Math.ceil(vb.y);y<Math.min(atlas.height,vb.y+vb.height);y++)for(let x=Math.ceil(vb.x);x<Math.min(atlas.width,vb.x+vb.width);x++)if(rgba[(y*atlas.width+x)*4+3]>=200){left=Math.min(left,x);right=Math.max(right,x+1);top=Math.min(top,y);bottom=Math.max(bottom,y+1);}
   const ink=new DOMPoint((left+right)/2,(top+bottom)/2).matrixTransform(icon.getScreenCTM());
   const hb=hex.querySelector('.skill-face').getBBox(),center=new DOMPoint(hb.x+hb.width/2,hb.y+hb.height/2).matrixTransform(hex.getScreenCTM());
   const r=button.getBoundingClientRect(),canopy=button.closest('.research-canopy').getBoundingClientRect(),style=getComputedStyle(button);
   const branchY=canopy.top+parseFloat(style.getPropertyValue('--y'))/100*canopy.height,branchX=canopy.left+parseFloat(style.getPropertyValue('--x'))/100*canopy.width;
   return {id:button.dataset.research,dx:Math.abs(ink.x-center.x),dy:Math.abs(ink.y-center.y),fill:getComputedStyle(hex.querySelector('.skill-face')).fill,gap:Math.max(branchY-r.bottom,r.top-branchY,branchX-r.right,r.left-branchX),brightness:getComputedStyle(icon).filter,iconRatio:icon.getBoundingClientRect().width/r.width,glow:getComputedStyle(button).filter,within:r.left>=canopy.left&&r.right<=canopy.right&&r.top>=canopy.top-56};
  });
 });
 expect(results).toHaveLength(15);
 for(const result of results){
  expect(result.dx,result.id+' horizontal visible centre').toBeLessThan(.75);
  expect(result.dy,result.id+' vertical visible centre').toBeLessThan(.75);
  expect(result.fill,result.id+' moss plate').toBe('rgb(124, 140, 99)');
  expect(result.gap,result.id+' exposed twig').toBeGreaterThanOrEqual(6);
  expect(result.brightness).toContain('brightness(1.24)');
  expect(result.iconRatio).toBeCloseTo(result.id==='pierce'?.62:.5456,2);expect(result.glow).toBe('none');
  expect(result.within,result.id+' stays visible').toBe(true);
 }
}
module.exports={checkSkillButtons};
