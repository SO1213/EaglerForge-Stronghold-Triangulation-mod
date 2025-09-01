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
// Triangulation
 
