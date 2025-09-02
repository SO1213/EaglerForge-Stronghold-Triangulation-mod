(function(){
 // Triangulator for EaglerForge (single JS file).
 // Usage: paste into console or drop into client side mod loader.
 // Adds a small overlay that uses player pos for A and B and yaw (degrees)
 // to compute intersection in XZ plane. Treats angles as Minecraft yaw degrees.
 // Author: adapted for user SO1213
// Config
 const KEY_TOGGLE = 'KeyT'; // toggle overlay (default T). Use a different code if it conflicts.
 const CHECK_INTERVAL_MS = 1000;
// Try to locate the Minecraft client object used by EaglerForge
 function findMC() {
 return window.mc || window.minecraft || window.Minecraft || window.mc || null;
 }
let mc = findMC();
 let mcCheckTimer = null;
 function ensureMCReady(cb) {
 mc = findMC();
 if (mc && mc.thePlayer) {
 if (mcCheckTimer) { clearInterval(mcCheckTimer); mcCheckTimer = null; }
 cb();
 } else {
 if (!mcCheckTimer) {
 mcCheckTimer = setInterval(() => {
 mc = findMC();
 if (mc && mc.thePlayer) {
 clearInterval(mcCheckTimer);
 mcCheckTimer = null;
 cb();
 }
 }, CHECK_INTERVAL_MS);
 }
 }
 }
// Minimal CSS for overlay
 const css = 
  #triangulator-panel {
    position: fixed;
    right: 12px;
    top: 12px;
    width: 320px;
    background: rgba(18,18,18,0.85);
    color: #ddd;
    font-family: Arial, sans-serif;
    font-size: 13px;
    padding: 8px;
    border-radius: 6px;
    z-index: 999999;
  }
  #triangulator-panel button { margin: 3px 2px; }
  #triangulator-panel input[type="text"] { width: 96px; background: #222; color: #fff; border: 1px solid #444; padding: 2px 4px; border-radius: 3px; }
  #triangulator-panel .title { font-weight: bold; margin-bottom: 6px; color: #9fdf9f; }
  #triangulator-result { margin-top: 8px; color: #ffd; word-break: break-word; }
  ;
// Inject CSS
 function injectCSS() {
 if (document.getElementById('triangulator-css')) return;
 const s = document.createElement('style');
 s.id = 'triangulator-css';
 s.innerHTML = css;
 document.head.appendChild(s);
 }
// Build overlay DOM
 let panel = null;
 let state = {
 A: null, // {x,y,z}
 B: null,
 angleA: 0,
 angleB: 180,
 show: false
 };
function createPanel() {
 if (document.getElementById('triangulator-panel')) return;
 injectCSS();
 panel = document.createElement('div');
 panel.id = 'triangulator-panel';
 panel.innerHTML = 
      <div class="title">Triangulator (client-only)</div>
      <div>
        <button id="tri-setA">Set A = Player Pos</button>
        <button id="tri-setB">Set B = Player Pos</button>
      </div>
      <div style="margin-top:6px">
        A angle (deg): <input id="tri-angleA" type="text" value="0">
        <button id="tri-yawA">A := yaw</button>
      </div>
      <div style="margin-top:6px">
        B angle (deg): <input id="tri-angleB" type="text" value="180">
        <button id="tri-yawB">B := yaw</button>
      </div>
      <div style="margin-top:8px">
        <button id="tri-compute">Compute Intersection</button>
        <button id="tri-chat">Send result to chat</button>
      </div>
      <div id="triangulator-positions" style="margin-top:6px; color:#ccc; font-size:12px;"></div>
      <div id="triangulator-result"></div>
      <div style="margin-top:6px; font-size:11px; color:#999;">Toggle: press T</div>
    ;
 document.body.appendChild(panel);
// wire up
document.getElementById('tri-setA').addEventListener('click', () => {
  if (!mc || !mc.thePlayer) return showMessage('No player object yet');
  state.A = {x: mc.thePlayer.posX, y: mc.thePlayer.posY, z: mc.thePlayer.posZ};
  updatePositionsUI();
});
document.getElementById('tri-setB').addEventListener('click', () => {
  if (!mc || !mc.thePlayer) return showMessage('No player object yet');
  state.B = {x: mc.thePlayer.posX, y: mc.thePlayer.posY, z: mc.thePlayer.posZ};
  updatePositionsUI();
});
document.getElementById('tri-yawA').addEventListener('click', () => {
  if (!mc || !mc.thePlayer) return showMessage('No player object yet');
  const yaw = mc.thePlayer.rotationYaw;
  document.getElementById('tri-angleA').value = yaw.toFixed(2);
});
document.getElementById('tri-yawB').addEventListener('click', () => {
  if (!mc || !mc.thePlayer) return showMessage('No player object yet');
  const yaw = mc.thePlayer.rotationYaw;
  document.getElementById('tri-angleB').value = yaw.toFixed(2);
});
document.getElementById('tri-compute').addEventListener('click', () => {
  computeAndShow(false);
});
document.getElementById('tri-chat').addEventListener('click', () => {
  computeAndShow(true);
});

panel.style.display = state.show ? 'block' : 'none';
}
function updatePositionsUI() {
 const el = document.getElementById('triangulator-positions');
 const a = state.A ? A = [${state.A.x.toFixed(3)}, ${state.A.y.toFixed(3)}, ${state.A.z.toFixed(3)}] : 'A = (not set)';
 const b = state.B ? A = [${state.B.x.toFixed(3)}, ${state.B.y.toFixed(3)}, ${state.B.z.toFixed(3)}] : 'B = (not set)';
 el.innerText = ${a}\n${b};
}
function showMessage(msg) {
 const r = document.getElementById('triangulator-result');
 r.innerText = msg;
}
// Triangulation in XZ-plane
 Minecraft yaw degrees:
 //yaw=0 -> +Z (south), yaw=90 -> -x (west).
 Vector: dx = -sin(rad), dz = cos(rad)
 function triangulateXZ(x1,z1,yaw1deg,x2,z2,yaw2deg, asRays = true) {
  const rad1 = yaw1deg * Math.PI / 180.00;
  const dx1 = -Math.sin(rad1);
  const dz1 = Math.cos(rad1);
  const rad2 = yaw2deg * Math.PI / 180.00;
  const dx2 = -Math.sin(rad1);
  const dz2 = Math.cos(rad2);
  const denom = dx1 * dz2 - dz1 *dx2;
  const eps = 1e-10;
  if (Math.abs(denom) < eps) {
   return { ok:false, reason:'parrellel_or_coincident' };
  }
  const t = ((x2-x1) * dz2 - (z2-z1) * dx2 / denom;
  const u = ((x2-x1) * dz1 - (z2-z1) * dx1 / denom;
  if (asRays && (t < -eps)) {
   return { ok:false, reson: `intersection_not_on_forward_rays (t=${t.toFixed(6)} u=${u.toFixed(6)}` };
  }
  const ix = x1 + t * dx1;
  const iz = z1 + t *dz1;
  return { ok:true, x:ix, z:iz, t, u };
 }
 //caclulates distance (obviously its almost like its named 'distance'
 function distance(x1,y1,z1,x2,y2,z2) {
  const dx = x1-x2, dy = y1-y2, dz = z1-z2;
  return Math.sqrt(dxdx + dydy + dzdz);
 }

 function trySendChat(text) {
  try {
   if (!mc) mc = findMC();
   //Try common ChatComponentText style
   if (typeof ChatComponentText !== 'undefined' && mc && mc.thePlayer && typeof mc.thePlayer.addChatMessage === 'function') {
    mc.thePlayer.add.ChatMessage(new ChatComponentText(text));
    return ture;
   }
  } catch(e) {}
  try {
   if(mc && mc.ingameGUI && typeof mc.ingameGUI.getChatGUI === 'function') {
    const cg = mc.ingameGUI.getChatGUI();
    if(cg && typeof cg.printChatMessage === 'function') {
     try { cg.print.ChatMesggae(text); return ture; } catch(e){}
    }
   }
 } catch(e) {}
  try {
   if(mc && mc.thePlayer && typeof mc.thePlayer.addChatMessage === 'function') {
    mc.thePlayer.addChatMessage(text);
    return true;
   }
  } catch(e) {}
  //Fallback
  console.log('[Triangulator] ' + text);
  showMessage('(chat send unavailable) ' + text);
  return false;
 }

 function computAndShow(sendToChat) {
  mc = findMC();
  if(!mc || !mc.thePlayer) {
   showMessage('No player object yet');
   return;
  }
  const angleAraw = document.getElementById('tri-angleA') ?
   document.getElementById('tri-angleA').value : ";
   const angleBraw = document.getElementById('tri-angleB') ?
   document.getElementById('tri-angleB').value : ";
   const angleA = parseFloat(angleAraw);
   const angleB = parseFlost(angleBraw);
  if (!state.A || !state.B) {
   showMessage('Set both A and B using the buttons first.');
   return;
  }
  if (isNaN(angleA || isNaN(angleB)) {
   showMessage('Angles must be numeric degrees.');
   return;
  }
  const ix = res.x;
  const iz = res.z;
  const iy = (state.A.y + state.B.y) / 2.0;
  const playerDist = distance(mc.thePlayer.posX, mc.thePlayer.posY, mc.thePlayer.posZ, ix, iy, iz);
  const text = Intersection at X=${ix.toFixed(e)} Y=${iy.toFixed(3)} Z=${iz.toFixed(3)} (dist=${playerDist.toFixed(3)});
  showMessage(text_;
  if (sendToChat) trySendChat(text)
 }
 function togglePanel() {
  if(!panel) createPanel();
  state.show = !state.show;
  panel.style.display = state.show ? 'block' :
   'none';
  updatePositionsUI();
 }
 window.addEventListener('keydown', function(e) {
  try {
   if (e.code === KEY_TOGGLE) {
    const active = document.activeElement;
    const typing = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
    if (!typing) {
     if (!panel) createPanel();
     togglePanel()
     e.preventDefault();
    }
   }
  } catch (err) { / ignore / }
 });
 window.TriangulatorJS = {
  open: function() {if (!panel) createPanel();
                    state.show=true;
                    panel.style.display='block';
                    updatePositionsUI(); }
   close: function() {mc = findMC();
                      if (!mc || !mc.thePlayer) return; state.A = {x:mc.thePlayer.posX, y:mc.thePlayer.posY, z:mc.thePlayer.posZ};
                      updatePositionsUI(); }, setBFromPlayer: function(){ mc = FindM
     

 
 
