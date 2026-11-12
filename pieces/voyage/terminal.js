// The hidden terminal. It opens when a green cursor is found, or when someone types "hack" at the keyboard.
export function createTerminal({ scenes, here, save, onRoot, onMatrix }) {
  const box = document.querySelector('#term'), out = document.querySelector('#term-out'), input = document.querySelector('#term-in');
  const found = () => save.load().eggs ?? [], say = line => { out.textContent += line + '\n'; out.scrollTop = out.scrollHeight; };
  const commands = {
    help: () => 'whoami   who is at the keyboard\nls       the scenes, and which cursors are found\ncd NAME  go to a scene (a name or a number)\nroot     give Mark root access\nmatrix   see it the way a hacker does\ncat motd message of the day\nexit     back to the game',
    whoami: () => '007\nmark. computer hacker. sailor. father of three.',
    ls: () => scenes.map(s => `${found().includes(s.id) ? '[>_]' : '[  ]'}  ${String(s.number)}  ${s.id.padEnd(10)} ${s.title}`).join('\n') + `\n${found().length}/${scenes.length} cursors found`,
    cd: arg => { const s = scenes.find(c => c.id === arg || String(c.number) === arg || c.title.toLowerCase() === (arg ?? '').toLowerCase()); if (!s) return `cd: no such scene: ${arg ?? ''}`; setTimeout(() => { location.search = `?chapter=${s.id}`; }, 350); return `entering ${s.title}...`; },
    root: () => { const on = !save.load().root; save.store({ root: on }); onRoot(on); return on ? 'root access granted.\nMark can now work any lever from wherever he stands.' : 'root access dropped.'; },
    matrix: () => { const n = found().length; if (n < scenes.length) return `access denied: ${n}/${scenes.length} cursors found. find them all.`; const on = !save.load().matrix; save.store({ matrix: on }); onMatrix(on); return on ? 'wake up.' : 'back to the daylight.'; },
    cat: arg => (arg === 'motd' ? 'MESS WITH THE BEST,\nDIE LIKE THE REST.' : `cat: ${arg ?? ''}: no such file`),
    sudo: () => '007 is already in the sudoers file. obviously.',
    id: () => 'uid=0(007) gid=0(root) groups=0(root),7(sailors)',
    hack: arg => (/planet/i.test(arg ?? '') ? 'HACK THE PLANET!' : 'hack what?'),
    clear: () => { out.textContent = ''; return ''; },
    exit: () => { close(); return ''; }, quit: () => { close(); return ''; }
  };
  function run(line) {
    const text = line.trim(); say(`007@disco-volante:~# ${text}`); if (!text) return;
    const [name, ...rest] = text.split(/\s+/), fn = commands[name.toLowerCase()];
    const reply = fn ? fn(rest.join(' ') || undefined) : /mess with the best/i.test(text) ? 'die like the rest.' : `${name}: command not found`;
    if (reply) say(reply);
  }
  function open(message) {
    if (!box.hidden) { if (message) say(message); return; }
    box.hidden = false; out.textContent = ''; say('MESS WITH THE BEST, DIE LIKE THE REST.\n'); if (message) say(message); say("type 'help'.\n"); input.value = ''; input.focus({ preventScroll: true });
  }
  function close() { box.hidden = true; input.blur(); }
  document.querySelector('#term form').addEventListener('submit', e => { e.preventDefault(); run(input.value); input.value = ''; });
  input.addEventListener('keydown', e => { if (e.key === 'Escape') close(); e.stopPropagation(); });
  // Typing h-a-c-k anywhere on the page opens it too.
  let typed = ''; addEventListener('keydown', e => { if (!box.hidden || e.key.length !== 1) return; typed = (typed + e.key.toLowerCase()).slice(-4); if (typed === 'hack') { typed = ''; open(`cursor status: ${found().length}/${scenes.length} found. you are in ${here.title}.`); e.preventDefault(); } });
  return { open, close, get isOpen() { return !box.hidden; } };
}
