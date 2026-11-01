const methods = [
    {
        name: "Brute force",
        desc: "Try every way to place the parentheses. Always correct, and quickly unaffordable: 4 matrices have 5 orders, 20 matrices have over a billion.",
        feats: ["Checks every split recursively", "Time grows exponentially", "No table, just the call stack"]
    },
    {
        name: "Memoized",
        desc: "The same recursion, but each subchain is solved once and remembered. Write it straight from the recurrence and let the cache do the saving.",
        feats: ["Top-down recursion with a cache", "O(n³) time, O(n²) space", "Closest to the math"]
    },
    {
        name: "Tabulated",
        desc: "Fill the table by chain length, shortest first. No recursion, and every cell is built from cells that are already finished.",
        feats: ["Bottom-up by chain length", "O(n³) time, O(n²) space", "Rebuilds the best order from split points"]
    }
];

const dims = [40, 20, 30, 10, 30], n = 4, sub = ['₁', '₂', '₃', '₄'];
const m = [], s = [];
for (let i = 0; i <= n; i++) { m[i] = []; s[i] = []; m[i][i] = 0; }
for (let len = 2; len <= n; len++) for (let i = 1; i <= n - len + 1; i++) {
    const j = i + len - 1; m[i][j] = Infinity;
    for (let k = i; k < j; k++) {
        const c = m[i][k] + m[k + 1][j] + dims[i - 1] * dims[k] * dims[j];
        if (c < m[i][j]) { m[i][j] = c; s[i][j] = k; }
    }
}
const orders = {
    1: [[3, 4], [2, 3], [2, 4], [1, 2], [1, 3], [1, 4]],
    2: [[1, 2], [2, 3], [3, 4], [1, 3], [2, 4], [1, 4]]
};
const brute = [
    ["(A₁(A₂(A₃A₄)))", 51000], ["(A₁((A₂A₃)A₄))", 36000], ["((A₁A₂)(A₃A₄))", 69000],
    ["((A₁(A₂A₃))A₄)", 26000], ["(((A₁A₂)A₃)A₄)", 48000]
];
const fmt = x => x.toLocaleString('en-US');
const ICON = '<svg viewBox="0 0 26 26" fill="none" stroke="#fdebd6" stroke-width="1.6"><circle cx="13" cy="13" r="11" stroke-dasharray="1.6 2.6"/><circle cx="13" cy="13" r="6.5" stroke-dasharray="1.2 2.4" opacity=".7"/></svg>';
const $ = id => document.getElementById(id);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

$('chain').innerHTML = [...Array(n)].map((_, i) => `<span class="chip">A${sub[i]}<small>${dims[i]}×${dims[i + 1]}</small></span>`).join('');

let mode = 0, step = 0, timer;

function total() { return mode === 0 ? brute.length : orders[mode].length; }

function draw() {
    const N = total(), done = step >= N;
    if (mode === 0) {
        const bestIdx = 3;
        $('body').innerHTML = '<div class="rows">' + brute.map(([p, c], i) => {
            let cls = i < step ? 'done' : '';
            if (i === step - 1 && !done) cls = 'cur';
            if (done && i === bestIdx) cls = 'best';
            return `<div class="row ${cls}"><span>${p}</span><span class="bar"><i style="--w:${c / 690}%"></i></span><span class="v">${fmt(c)}</span></div>`;
        }).join('') + '</div>';
        $('status').innerHTML = done
            ? `<b>${fmt(26000)}</b> multiplications is the cheapest of all 5 orders`
            : step === 0 ? 'Trying every parenthesization…' : `Order ${step} of 5 costs <b>${fmt(brute[step - 1][1])}</b>`;
    } else {
        const ord = orders[mode], at = new Map(ord.map((p, i) => [p.join(), i]));
        let h = '<div class="grid"><span></span>' + [1, 2, 3, 4].map(j => `<span class="hd">${j}</span>`).join('');
        for (let i = 1; i <= n; i++) {
            h += `<span class="hd">${i}</span>`;
            for (let j = 1; j <= n; j++) {
                if (j < i) { h += '<div class="cell void"></div>'; continue; }
                if (i === j) { h += '<div class="cell done">0</div>'; continue; }
                const idx = at.get(i + ',' + j);
                let cls = idx < step ? 'done' : 'todo';
                if (idx === step - 1 && !done) cls = 'cur';
                if (done && i === 1 && j === n) cls = 'best';
                h += `<div class="cell ${cls}">${fmt(m[i][j])}<small>k=${s[i][j]}</small></div>`;
            }
        }
        $('body').innerHTML = h + '</div>';
        const verb = mode === 1 ? 'solved' : 'filled';
        if (done) $('status').innerHTML = `Best order <b>((A₁(A₂A₃))A₄)</b> costs <b>${fmt(m[1][n])}</b> multiplications`;
        else if (step === 0) $('status').textContent = mode === 1 ? 'Recursing from the full chain, caching as it returns…' : 'Filling by chain length, shortest first…';
        else { const [i, j] = ord[step - 1]; $('status').innerHTML = `m[${i},${j}] ${verb}: <b>${fmt(m[i][j])}</b> at split k=${s[i][j]}`; }
    }
}

function start() {
    clearInterval(timer); step = 0; draw();
    if (reduce) { step = total(); draw(); return; }
    timer = setInterval(() => { step++; if (step > total() + 2) step = 0; draw(); }, 1000);
}

function render(i) {
    const x = methods[i];
    $('name').textContent = x.name;
    $('desc').textContent = x.desc;
    $('feats').innerHTML = x.feats.map(f => `<li>${ICON}<span>${f}</span></li>`).join('');
    mode = i; start();
}
render(0);

const swaps = document.querySelectorAll('.swap');
document.querySelectorAll('.tab').forEach(btn => btn.addEventListener('click', () => {
    const i = +btn.dataset.i;
    if (i === mode) return;
    document.querySelectorAll('.tab').forEach(b => b.setAttribute('aria-selected', b === btn));
    swaps.forEach(el => el.classList.add('out'));
    setTimeout(() => { render(i); swaps.forEach(el => el.classList.remove('out')); }, 250);
}));

/* custom pointer */
(() => {
    if (!matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    const root = document.documentElement;
    root.classList.add('has-cursor');
    const mk = c => { const e = document.createElement('div'); e.className = c; document.body.appendChild(e); return e; };
    const dot = mk('c-dot'), br = mk('c-br');

    const SEL = 'a,button';
    const k = reduce ? 1 : .18;
    let mx = -200, my = -200, seen = false, down = false, hov = false;
    const b = { x: 0, y: 0, w: 44, h: 44 };

    addEventListener('pointermove', e => {
        mx = e.clientX; my = e.clientY;
        if (!seen) { seen = true; b.x = mx - 22; b.y = my - 22; }
        root.classList.add('c-on');
    });
    root.addEventListener('mouseleave', () => root.classList.remove('c-on'));
    document.addEventListener('pointerover', e => { hov = !!(e.target.closest && e.target.closest(SEL)); root.classList.toggle('c-hov', hov); root.classList.toggle('c-cta', !!(e.target.closest && e.target.closest('.nav-cta'))); });
    addEventListener('pointerdown', e => {
        down = true; root.classList.add('c-down');
        if (reduce) return;
        const r = mk('c-rip'); r.style.setProperty('--x', e.clientX + 'px'); r.style.setProperty('--y', e.clientY + 'px');
        r.addEventListener('animationend', () => r.remove());
    });
    const upd = () => root.classList.toggle('c-sel', down && !getSelection().isCollapsed);
    document.addEventListener('selectionchange', upd);
    addEventListener('pointerup', () => { down = false; root.classList.remove('c-down'); upd(); });

    function frame() {
        const s = down ? 32 : hov ? 56 : 44;
        const tw = s, th = s, tx = mx - s / 2, ty = my - s / 2;
        b.x += (tx - b.x) * k; b.y += (ty - b.y) * k; b.w += (tw - b.w) * k; b.h += (th - b.h) * k;
        br.style.transform = `translate(${b.x}px,${b.y}px)`;
        br.style.width = b.w + 'px'; br.style.height = b.h + 'px';
        dot.style.transform = `translate(${mx}px,${my}px)`;

        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
})();

const bar = $('bar');
function onScroll() {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.height = (30 + (max > 0 ? scrollY / max : 0) * 70) + '%';
}
addEventListener('scroll', onScroll, { passive: true }); onScroll();