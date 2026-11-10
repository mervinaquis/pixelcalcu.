let current = '';
let preview = '';
let soundOn = true;
let calcHistory = JSON.parse(localStorage.getItem('pixelCalcHistory') || '[]');
const display = document.getElementById('display');
const previewEl = document.getElementById('history-preview');
const panel = document.getElementById('history-panel');
const listEl = document.getElementById('history-list');
const emptyMsg = document.getElementById('empty-msg');
const screenEl = document.getElementById('screen');
const calcBox = document.getElementById('calcBox');
const soundBtn = document.getElementById('soundBtn');
let audioCtx = null;
function playSound(type) {
  if (!soundOn) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.type = 'square';
    let freq = 440, duration = 0.08;
    if (type === 'num') { freq = 600; duration = 0.06; }
    if (type === 'op') { freq = 400; duration = 0.08; }
    if (type === 'del') { freq = 300; duration = 0.1; }
    if (type === 'clear') { freq = 200; duration = 0.15; }
    if (type === 'equal') { freq = 880; duration = 0.25; }
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start(); osc.stop(audioCtx.currentTime + duration);
    if (type === 'equal') setTimeout(() => playSound('num'), 120);
  } catch (e) {}
}
function toggleSound() {
  soundOn = !soundOn;
  soundBtn.textContent = soundOn ? 'SOUND: ON' : 'SOUND: OFF';
  soundBtn.classList.toggle('off', !soundOn);
  if (soundOn) playSound('num');
}
function pressBtn(btn, type) {
  playSound(type);
  btn.classList.remove('pop');
  void btn.offsetWidth;
  btn.classList.add('pop');
}
function update() {
  display.textContent = current || '0';
  previewEl.textContent = preview;
}
function addNum(n) {
  if (n === '.' && current.includes('.')) return;
  current += n; update();
}
function addOp(op) {
  if (!current) return;
  if (['+', '-', '*', '/', '%'].includes(current.slice(-1))) current = current.slice(0, -1) + op;
  else current += op;
  update();
}
function delChar() { current = current.slice(0, -1); update(); }
function clearAll() { current = ''; preview = ''; update(); }
function calculate() {
  if (!current) return;
  try {
    let expr = current.replace(/%/g, '/100');
    let result = eval(expr);
    result = Math.round(result * 1000000) / 1000000;
    calcHistory.unshift({ expr: current, result: String(result) });
    if (calcHistory.length > 20) calcHistory.pop();
    localStorage.setItem('pixelCalcHistory', JSON.stringify(calcHistory));
    preview = current + ' =';
    current = String(result);
    update(); renderHistory();
    screenEl.classList.remove('flash'); void screenEl.offsetWidth; screenEl.classList.add('flash');
    calcBox.classList.remove('shake'); void calcBox.offsetWidth; calcBox.classList.add('shake');
  } catch { current = 'ERROR'; update(); setTimeout(clearAll, 1000); }
}
function toggleHistory() { panel.classList.toggle('hidden'); renderHistory(); }
function renderHistory() {
  listEl.innerHTML = '';
  if (calcHistory.length === 0) { emptyMsg.style.display = 'block'; return; }
  emptyMsg.style.display = 'none';
  calcHistory.forEach((item) => {
    const li = document.createElement('li');
    li.innerHTML = item.expr + ' <span>= ' + item.result + '</span>';
    li.onclick = () => { playSound('num'); current = item.result; preview = ''; update(); };
    listEl.appendChild(li);
  });
}
function clearHistory() {
  calcHistory = [];
  localStorage.removeItem('pixelCalcHistory');
  renderHistory();
}
document.addEventListener('keydown', e => {
  if (/[0-9.]/.test(e.key)) { playSound('num'); addNum(e.key); }
  if (['+', '-', '*', '/', '%'].includes(e.key)) { playSound('op'); addOp(e.key); }
  if (e.key === 'Enter') { playSound('equal'); calculate(); }
  if (e.key === 'Backspace') { playSound('del'); delChar(); }
  if (e.key === 'Escape') { playSound('clear'); clearAll(); }
});
renderHistory();
update();