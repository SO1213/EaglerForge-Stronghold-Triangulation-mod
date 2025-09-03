document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("triCanvas");
  const ctx = canvas.getContext("2d");

  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  const padding = 40;

  const xMin = -300, xMax = 300, yMin = -300, yMax = 300;

  function clearCanvas() { ctx.clearRect(0, 0, canvasWidth, canvasHeight); }

  function toCanvasCoords(x, y) {
    const scaleX = (canvasWidth - 2*padding)/(xMax - xMin);
    const scaleY = (canvasHeight - 2*padding)/(yMax - yMin);
    const cx = padding + (x - xMin) * scaleX;
    const cy = canvasHeight - padding - (y - yMin) * scaleY;
    return { cx, cy };
  }

  function drawGrid() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.strokeStyle = "#ddd";
    ctx.lineWidth = 1;

    // Grid lines
    for(let x = xMin; x <= xMax; x+=50){
      const {cx} = toCanvasCoords(x,0);
      ctx.beginPath();
      ctx.moveTo(cx,padding);
      ctx.lineTo(cx,canvasHeight-padding);
      ctx.stroke();
      if(x!==0){ctx.fillStyle="#000";ctx.font="12px Arial";ctx.textAlign="center";ctx.fillText(x,cx,toCanvasCoords(0,0).cy+15);}
    }
    for(let y = yMin; y <= yMax; y+=50){
      const {cy} = toCanvasCoords(0,y);
      ctx.beginPath();
      ctx.moveTo(padding,cy);
      ctx.lineTo(canvasWidth-padding,cy);
      ctx.stroke();
      if(y!==0){ctx.fillStyle="#000";ctx.font="12px Arial";ctx.textAlign="right";ctx.fillText(y,toCanvasCoords(0,0).cx-5,cy+4);}
    }

    // axes
    ctx.strokeStyle="#000"; ctx.lineWidth=2;
    const origin = toCanvasCoords(0,0);
    // X-axis
    ctx.beginPath(); ctx.moveTo(padding,origin.cy); ctx.lineTo(canvasWidth-padding,origin.cy); ctx.stroke();
    // Y-axis
    ctx.beginPath(); ctx.moveTo(origin.cx,canvasHeight-padding); ctx.lineTo(origin.cx,padding); ctx.stroke();
    // arrows
    const arrowSize=10;
    // X
    ctx.beginPath(); ctx.moveTo(canvasWidth-padding,origin.cy); ctx.lineTo(canvasWidth-padding-arrowSize,origin.cy-arrowSize/2); ctx.lineTo(canvasWidth-padding-arrowSize,origin.cy+arrowSize/2); ctx.closePath(); ctx.fillStyle="#000"; ctx.fill();
    // Y
    ctx.beginPath(); ctx.moveTo(origin.cx,padding); ctx.lineTo(origin.cx-arrowSize/2,padding+arrowSize); ctx.lineTo(origin.cx+arrowSize/2,padding+arrowSize); ctx.closePath(); ctx.fill();
  }

  function drawLine(x0,y0,slope){
    const xStart=xMin;
    const yStart=y0+slope*(xStart-x0);
    const xEnd=xMax;
    const yEnd=y0+slope*(xEnd-x0);
    const start=toCanvasCoords(xStart,yStart);
    const end=toCanvasCoords(xEnd,yEnd);
    ctx.beginPath(); ctx.moveTo(start.cx,start.cy); ctx.lineTo(end.cx,end.cy); ctx.stroke();
  }

  function drawPoint(x,y,color,label){
    const p=toCanvasCoords(x,y);
    ctx.fillStyle=color;
    ctx.beginPath();
    ctx.arc(p.cx,p.cy,5,0,2*Math.PI);
    ctx.fill();
    ctx.fillText(label,p.cx+5,p.cy-5);
  }

  // Law of Sines helper
  function lawOfSines(a,b,A,B){ return (b*Math.sin(A))/Math.sin(B); }

  // Law of Cosines helper
  function lawOfCosines(a,b,C){ return Math.sqrt(a*a+b*b-2*a*b*Math.cos(C)); }

  document.getElementById("calcBtn").addEventListener("click",()=>{
    const triType=document.getElementById("triType").value;
    const x1=parseFloat(document.querySelector(".x1").value);
    const y1=parseFloat(document.querySelector(".y1").value);
    const ang1=parseFloat(document.querySelector(".ang1").value);
    const x2=parseFloat(document.querySelector(".x2").value);
    const y2=parseFloat(document.querySelector(".y2").value);
    const ang2=parseFloat(document.querySelector(".ang2").value);

    clearCanvas(); drawGrid();

    ctx.strokeStyle="red"; ctx.lineWidth=2;

    if(triType==="AA"){
      const theta1=ang1*Math.PI/180; const theta2=ang2*Math.PI/180;
      const m1=Math.tan(theta1); const m2=Math.tan(theta2);
      const x=(m1*x1 - m2*x2 + y2 - y1)/(m1-m2);
      const y=m1*(x-x1)+y1;
      drawLine(x1,y1,m1); drawLine(x2,y2,m2);
      drawPoint(x1,y1,"blue","O1"); drawPoint(x2,y2,"blue","O2"); drawPoint(x,y,"green","Target");
      document.getElementById("result").textContent=`Target: x=${x.toFixed(2)}, y=${y.toFixed(2)}`;
    }

    else if(triType==="ASA"){
      // ASA: need one side, two angles
      // For simplicity, assume side between observers is known
      const side=parseFloat(prompt("Enter side length between observers:"));
      const A=ang1*Math.PI/180, B=ang2*Math.PI/180;
      const C=Math.PI-A-B;
      const distToTarget=lawOfSines(side,C,B);
      // direction from O1 to O2 vector
      const dx=x2-x1, dy=y2-y1, dist=Math.hypot(dx,dy);
      const unitX=dx/dist, unitY=dy/dist;
      const x=x1+unitX*distToTarget; const y=y1+unitY*distToTarget;
      drawLine(x1,y1,0); drawLine(x2,y2,0); // simplified, can be improved
      drawPoint(x1,y1,"blue","O1"); drawPoint(x2,y2,"blue","O2"); drawPoint(x,y,"green","Target");
      document.getElementById("result").textContent=`Target: x=${x.toFixed(2)}, y=${y.toFixed(2)}`;
    }

    else if(triType==="SAS"){
      // SAS: two sides and included angle
      const side1=parseFloat(prompt("Enter side from O1 to Target:"));
      const side2=parseFloat(prompt("Enter side from O2 to Target:"));
      const included=parseFloat(prompt("Enter included angle (deg) between sides:"))*Math.PI/180;
      // Law of Cosines for third side
      const side3=lawOfCosines(side1,side2,included);
      // Place O1 at origin
      const x=side1*Math.cos(included); const y=side1*Math.sin(included);
      drawPoint(0,0,"blue","O1"); drawPoint(side2,0,"blue","O2"); drawPoint(x,y,"green","Target");
      document.getElementById("result").textContent=`Target: x=${x.toFixed(2)}, y=${y.toFixed(2)}`;
    }

    else if(triType==="SSS"){
      // SSS: three sides known
      const a=parseFloat(prompt("Enter side a (O2-Target):"));
      const b=parseFloat(prompt("Enter side b (O1-Target):"));
      const c=parseFloat(prompt("Enter side c (O1-O2):"));
      // Compute angles with Law of Cosines
      const A=Math.acos((b*b + c*c - a*a)/(2*b*c));
      const x=b*Math.cos(A); const y=b*Math.sin(A);
      drawPoint(0,0,"blue","O1"); drawPoint(c,0,"blue","O2"); drawPoint(x,y,"green","Target");
      document.getElementById("result").textContent=`Target: x=${x.toFixed(2)}, y=${y.toFixed(2)}`;
    }
  });
});
