// One diagram per published or accepted paper, and one for the thesis as a whole.
(function () {
  'use strict';
  const S = window.Diagrams.specs;

  // the thesis: where each piece of work sits on a RISC-V system
  S.thesis = {
    w: 680, h: 330, title: 'The thesis on one page', caption: 'Each piece of the thesis sits at one place a secret can leak from a RISC-V system: the predictor, the walker, the cache, the shared LLC and the memory bus. ARCHER is the emulator the attacks and defences were first tried on; the RTL work runs on BOOM and Rocket.',
    groups: [{ x: 14, y: 14, w: 470, h: 300, t: 'an out-of-order RISC-V core (BOOM / Rocket)' }, { x: 498, y: 14, w: 168, h: 300, t: 'outside the chip' }],
    nodes: [
      { id: 'fe', x: 34, y: 44, w: 120, h: 44, t: 'branch predictor', s: 'CHROMA', c: 'b' },
      { id: 'ex', x: 184, y: 44, w: 120, h: 44, t: 'pipeline', s: 'speculation' },
      { id: 'ptw', x: 334, y: 44, w: 130, h: 44, t: 'page-table walker', s: 'TWIG', c: 'b' },
      { id: 'l1', x: 184, y: 128, w: 120, h: 44, t: 'L1 data cache', s: 'mspecsafe', c: 'b' },
      { id: 'hint', x: 34, y: 128, w: 120, h: 44, t: 'HINT directives', s: 'SafeHint', c: 'b' },
      { id: 'llc', x: 184, y: 214, w: 280, h: 44, t: 'shared last-level cache', s: 'SetSentry · DIRS', c: 'b' },
      { id: 'pace', x: 334, y: 128, w: 130, h: 44, t: 'encryption engine', s: 'PACE', c: 'b' },
      { id: 'dram', x: 524, y: 120, w: 120, h: 60, t: 'DRAM', s: 'ciphertext only', k: 'mem' },
      { id: 'atk', x: 548, y: 228, w: 72, h: 52, t: 'attacker', k: 'actor', c: 'w' },
      { id: 'arch', x: 34, y: 214, w: 120, h: 44, t: 'ARCHER', s: 'emulator', k: 'pill' },
    ],
    links: [
      { a: 'fe', b: 'ex' }, { a: 'ex', b: 'ptw' }, { a: 'ex', b: 'l1', as: 'b', bs: 't' }, { a: 'l1', b: 'llc', as: 'b', bs: 't' },
      { a: 'llc', b: 'pace', as: 'r', bs: 'b', bend: 0.6 }, { a: 'pace', b: 'dram', t: 'encrypted' },
      { a: 'atk', b: 'llc', k: 'block', as: 't', bs: 'r', t: 'probe' }, { a: 'atk', b: 'dram', k: 'block', as: 't', bs: 'b' },
      { a: 'hint', b: 'ex', k: 'ctrl', as: 't', bs: 'l', bend: 0.5 }, { a: 'arch', b: 'hint', k: 'ctrl', as: 't', bs: 'b' },
    ],
  };

  S.pace = {
    w: 680, h: 300, title: 'PACE', caption: 'A line leaving the cache is XORed with a keystream computed while it was still cached, so a writeback takes 10 cycles instead of 90. Each page gets its own policy, and the one block that touches the key is masked, so its power trace says nothing.',
    groups: [{ x: 196, y: 30, w: 300, h: 240, t: 'PACE, between the LLC and the memory port' }],
    nodes: [
      { id: 'llc', x: 24, y: 70, w: 130, h: 50, t: 'last-level cache', s: 'plaintext lines' },
      { id: 'pt', x: 24, y: 180, w: 130, h: 50, t: 'page table bits', s: 'policy per page', c: 'd' },
      { id: 'pol', x: 216, y: 62, w: 120, h: 40, t: 'policy', s: 'none · C · C+I · masked', c: 'b' },
      { id: 'ks', x: 216, y: 130, w: 120, h: 44, t: 'keystream', s: 'precomputed in cache' },
      { id: 'asc', x: 216, y: 202, w: 120, h: 50, t: 'masked Ascon-p', s: 'd + 1 shares', k: 'chip', c: 'b' },
      { id: 'xor', x: 380, y: 92, w: 92, h: 44, t: '⊕ XOR', s: '10 cycles', k: 'pill' },
      { id: 'ctr', x: 380, y: 150, w: 92, h: 40, t: 'split counter', s: 'nonce · version · epoch', c: 'd' },
      { id: 'dram', x: 540, y: 80, w: 116, h: 66, t: 'DRAM', s: 'ciphertext', k: 'mem' },
      { id: 'dpa', x: 560, y: 196, w: 76, h: 60, t: 'power\nprobe', k: 'actor', c: 'w' },
    ],
    links: [
      { a: 'llc', b: 'xor', bs: 'l', t: 'evicted line', n: 4, ty: 20 }, { a: 'pt', b: 'pol', k: 'ctrl', bs: 'l' }, { a: 'ctr', b: 'ks', k: 'ctrl' },
      { a: 'asc', b: 'ks', as: 't', bs: 'b', t: 'fresh key' }, { a: 'ks', b: 'xor' }, { a: 'xor', b: 'dram', t: 'ciphertext', n: 4 },
      { a: 'dpa', b: 'asc', k: 'block', as: 'l', bs: 'r', t: 'trace' },
    ],
  };

  S.archer = {
    w: 680, h: 300, title: 'ARCHER', caption: 'One INI file describes the machine; ARCHER boots Linux on it in under three minutes and reports cycles and leakage, and every parameter is set at run time. Its timing was checked against gem5 and against Chipyard RTL.',
    nodes: [
      { id: 'ini', x: 20, y: 60, w: 110, h: 46, t: 'machine.ini', s: 'cores · caches · policies', c: 'd' },
      { id: 'elf', x: 20, y: 190, w: 110, h: 46, t: 'Linux / ELF', s: 'RV64IMAFDC', c: 'd' },
      { id: 'core', x: 190, y: 40, w: 150, h: 54, t: 'core model', s: 'scalar · in-order · OoO · SMT' },
      { id: 'spec', x: 190, y: 120, w: 150, h: 46, t: '13 speculation policies', s: '5 published · 7 new', c: 'b' },
      { id: 'mem', x: 190, y: 192, w: 150, h: 54, t: 'caches · TLBs · store buffer', s: 'MSI coherent, Sv39, PMP' },
      { id: 'ames', x: 380, y: 192, w: 110, h: 54, t: 'AMES', s: 'memory encryption', k: 'chip', c: 'b' },
      { id: 'out', x: 540, y: 60, w: 120, h: 54, t: 'cycles · leakage', s: 'per run', k: 'pill' },
      { id: 'g5', x: 540, y: 150, w: 120, h: 40, t: 'gem5', s: '3.7× slower boot', c: 'd' },
      { id: 'rtl', x: 540, y: 214, w: 120, h: 40, t: 'Chipyard RTL', s: '9.4% mean error', c: 'd' },
    ],
    links: [
      { a: 'ini', b: 'core', k: 'ctrl' }, { a: 'elf', b: 'mem', n: 4 }, { a: 'core', b: 'spec', as: 'b', bs: 't' }, { a: 'spec', b: 'mem', as: 'b', bs: 't' },
      { a: 'mem', b: 'ames' }, { a: 'core', b: 'out', t: 'measure', n: 4 }, { a: 'out', b: 'g5', k: 'ctrl', as: 'b', bs: 't' }, { a: 'ames', b: 'rtl', k: 'ctrl' },
    ],
  };

  S['novel-riscv-sca'] = {
    w: 680, h: 300, title: 'New side channels on open RISC-V cores', caption: 'Six cores from one flow differ in only a few structures, so each leak can be blamed on one of them. Every channel is measured, proved with an attack, run on an FPGA, and then closed.',
    nodes: [
      { id: 'r', x: 20, y: 30, w: 96, h: 34, t: 'Rocket', c: 'd' }, { id: 'v', x: 20, y: 74, w: 96, h: 34, t: 'VexiiRiscv', c: 'd' }, { id: 'c', x: 20, y: 118, w: 96, h: 34, t: 'CVA6', c: 'd' },
      { id: 'bm', x: 20, y: 162, w: 96, h: 34, t: 'BOOM M', c: 'd' }, { id: 'bl', x: 20, y: 206, w: 96, h: 34, t: 'BOOM L', c: 'd' }, { id: 'bx', x: 20, y: 250, w: 96, h: 34, t: 'BOOM Mega', c: 'd' },
      { id: 'tvla', x: 176, y: 110, w: 120, h: 56, t: 'TVLA + attack', s: 'Wilson 95% CI' },
      { id: 'ch', x: 346, y: 104, w: 120, h: 68, t: '23 channels', s: '6 new, e.g. PMPectre', c: 'w', k: 'pill' },
      { id: 'fpga', x: 518, y: 40, w: 140, h: 54, t: 'Zedboard FPGA', s: 'read out over JTAG', k: 'chip' },
      { id: 'mit', x: 518, y: 190, w: 140, h: 60, t: '8 mitigations', s: '6 cost ≤ 0.8% area', c: 'b' },
    ],
    links: [
      { a: 'r', b: 'tvla', n: 1, dur: 3.2 }, { a: 'v', b: 'tvla', n: 1, dur: 3.4 }, { a: 'c', b: 'tvla', n: 1, dur: 3 }, { a: 'bm', b: 'tvla', n: 1, dur: 3.6 }, { a: 'bl', b: 'tvla', n: 1, dur: 3.1 }, { a: 'bx', b: 'tvla', n: 1, dur: 3.3 },
      { a: 'tvla', b: 'ch', k: 'leak', n: 4 }, { a: 'ch', b: 'fpga', k: 'leak', t: 'confirm on silicon' }, { a: 'ch', b: 'mit', t: 'close', as: 'b', bs: 'l' },
    ],
  };

  S['twig-ptw-partitioning'] = {
    w: 680, h: 290, title: 'TWIG', caption: 'Page walks from two domains used to share the walker caches, so one domain could time the other. TWIG gives each domain its own ways and tags every walk with the domain that issued it, because on an out-of-order core the walk can finish after the switch.',
    nodes: [
      { id: 'a', x: 24, y: 50, w: 110, h: 46, t: 'domain A', s: 'victim' },
      { id: 'b', x: 24, y: 190, w: 110, h: 46, t: 'domain B', s: 'attacker', c: 'w' },
      { id: 'ptw', x: 196, y: 116, w: 130, h: 54, t: 'page-table walker', s: 'request tagged A / B' },
      { id: 'wa', x: 400, y: 70, w: 130, h: 46, t: 'walker cache', s: 'A ways only', c: 'b', k: 'chip' },
      { id: 'wb', x: 400, y: 172, w: 130, h: 46, t: 'walker cache', s: 'B ways only', c: 'w', k: 'chip' },
      { id: 'csr', x: 196, y: 30, w: 130, h: 34, t: 'one machine CSR', k: 'pill', c: 'd' },
      { id: 'l2', x: 570, y: 116, w: 90, h: 54, t: 'L2 TLB', s: 'misses counted', c: 'd' },
    ],
    links: [
      { a: 'a', b: 'ptw', n: 3 }, { a: 'b', b: 'ptw', n: 3, k: 'leak' }, { a: 'ptw', b: 'wa' }, { a: 'ptw', b: 'wb', k: 'leak' },
      { a: 'wb', b: 'wa', k: 'block', as: 't', bs: 'b', t: 'eviction across domains' }, { a: 'csr', b: 'ptw', k: 'ctrl', as: 'b', bs: 't' }, { a: 'wa', b: 'l2', k: 'ctrl' }, { a: 'wb', b: 'l2', k: 'ctrl' },
    ],
  };

  S['mspecsafe-spectre-v1-boom'] = {
    w: 680, h: 280, title: 'mspecsafe', caption: 'In Spectre-v1 a mispredicted bounds check lets a load run ahead; its miss allocates an MSHR and the refill puts the secret line into the cache, where the attacker times it. mspecsafe refuses a missing load while any older branch is unresolved.',
    nodes: [
      { id: 'br', x: 20, y: 110, w: 118, h: 54, t: 'if (x < len)', s: 'mispredicted', c: 'd' },
      { id: 'ld', x: 182, y: 110, w: 118, h: 54, t: 'load a[x]', s: 'runs ahead of the check', c: 'w' },
      { id: 'g', x: 346, y: 30, w: 132, h: 46, t: 'mspecsafe', s: 'CSR 0x80E: nack', c: 'b', k: 'chip' },
      { id: 'mshr', x: 346, y: 116, w: 132, h: 46, t: 'MSHR', s: 'miss handling' },
      { id: 'dc', x: 346, y: 200, w: 132, h: 46, t: 'data cache', s: 'secret line installed?' },
      { id: 'atk', x: 548, y: 180, w: 100, h: 74, t: 'attacker\ntimes reload', k: 'actor', c: 'w' },
    ],
    links: [
      { a: 'br', b: 'ld', k: 'ctrl' }, { a: 'ld', b: 'mshr', k: 'block', t: 'miss', sx: -16 }, { a: 'mshr', b: 'dc', k: 'leak', as: 'b', bs: 't', n: 2 },
      { a: 'g', b: 'mshr', k: 'ctrl', as: 'b', bs: 't' }, { a: 'dc', b: 'atk', k: 'leak', t: 'hit = 1, miss = 0' },
    ],
  };

  S['safehint-riscv-hint'] = {
    w: 680, h: 290, title: 'SafeHint', caption: 'A security directive is a HINT, a no-op to any core that does not know it. One read of useccap at start-up tells the program what the core will honour, and usecctl makes a partly aware core trap instead of silently doing nothing.',
    nodes: [
      { id: 'prog', x: 20, y: 110, w: 130, h: 60, t: 'program', s: 'rd = x0 HINT directive' },
      { id: 'cap', x: 200, y: 40, w: 130, h: 44, t: 'read useccap', s: 'at start-up', c: 'b', k: 'pill' },
      { id: 'un', x: 420, y: 30, w: 230, h: 46, t: 'unaware core', s: 'no-op · useccap traps: canary', c: 'd' },
      { id: 'pa', x: 420, y: 118, w: 230, h: 46, t: 'partly aware core', s: 'usecctl: trap if not honoured', c: 'w' },
      { id: 'aw', x: 420, y: 206, w: 230, h: 46, t: 'aware core', s: 'directive honoured (barrier)', c: 'b' },
    ],
    links: [
      { a: 'prog', b: 'cap', k: 'ctrl', as: 't', bs: 'l' }, { a: 'prog', b: 'un', n: 2, dur: 3 }, { a: 'prog', b: 'pa', n: 2, dur: 3 }, { a: 'prog', b: 'aw', n: 2, dur: 3 },
    ],
    notes: [{ x: 20, y: 270, t: 'fail-closed: never silently insecure', c: 'b' }],
  };

  S['chroma-branch-predictor'] = {
    w: 680, h: 300, title: 'CHROMA', caption: 'Colouring the table index alone still lets one domain read the other through the global history. CHROMA keys the index, the history and the return stack to a domain colour, and saves each domain\'s history on a switch so it comes back warm.',
    nodes: [
      { id: 'a', x: 20, y: 46, w: 100, h: 44, t: 'domain A', s: 'colour 1' },
      { id: 'b', x: 20, y: 196, w: 100, h: 44, t: 'domain B', s: 'colour 2', c: 'w' },
      { id: 'mc', x: 160, y: 120, w: 110, h: 46, t: 'mcolor CSR', s: '8-bit colour', k: 'pill', c: 'b' },
      { id: 'tage', x: 330, y: 30, w: 150, h: 54, t: 'TAGE-L tables', s: 'index ⊕ colour', k: 'chip' },
      { id: 'ghr', x: 330, y: 116, w: 150, h: 54, t: 'global history', s: 'banked, saved on switch', k: 'chip', c: 'b' },
      { id: 'ras', x: 330, y: 202, w: 150, h: 54, t: 'return stack', s: 'one per domain', k: 'chip' },
      { id: 'pred', x: 540, y: 116, w: 120, h: 54, t: 'prediction', s: 'warm, isolated', k: 'pill' },
    ],
    links: [
      { a: 'a', b: 'mc', k: 'ctrl' }, { a: 'b', b: 'mc', k: 'ctrl' }, { a: 'mc', b: 'tage' }, { a: 'mc', b: 'ghr' }, { a: 'mc', b: 'ras' },
      { a: 'tage', b: 'pred' }, { a: 'ghr', b: 'pred' }, { a: 'ras', b: 'pred' }, { a: 'b', b: 'ras', k: 'block', as: 'r', bs: 'l', t: 'history channel', bend: 0.3, sx: 30 },
    ],
  };

  S['setsentry-eviction-set-detection'] = {
    w: 680, h: 300, title: 'SetSentry', caption: 'Before Prime+Probe works, the attacker must build an eviction set, and that leaves a trail of cross-domain conflicts in a few cache sets. SetSentry watches only those sets and raises an interrupt when the build, assemble, probe pattern completes.',
    nodes: [
      { id: 'atk', x: 20, y: 40, w: 110, h: 50, t: 'attacker core', s: 'building a set', c: 'w' },
      { id: 'vic', x: 20, y: 200, w: 110, h: 50, t: 'victim core', s: 'normal work' },
      { id: 'l2', x: 190, y: 110, w: 140, h: 70, t: 'shared L2', s: 'cross-domain conflicts', k: 'chip' },
      { id: 'hst', x: 380, y: 40, w: 130, h: 46, t: 'hot-set table', s: 'Bloom filters', c: 'b' },
      { id: 'fsm', x: 380, y: 130, w: 130, h: 56, t: 'BUILD → ASSEMBLE\n→ PROBE', c: 'b', k: 'pill' },
      { id: 'irq', x: 556, y: 130, w: 104, h: 56, t: 'machine\ninterrupt', k: 'actor', c: 'w' },
      { id: 'ben', x: 380, y: 224, w: 130, h: 40, t: 'benign workloads', s: 'no alert', c: 'd' },
    ],
    links: [
      { a: 'atk', b: 'l2', k: 'leak', n: 4 }, { a: 'vic', b: 'l2', n: 2 }, { a: 'l2', b: 'hst', k: 'ctrl' }, { a: 'hst', b: 'fsm', as: 'b', bs: 't' },
      { a: 'fsm', b: 'irq', k: 'leak', t: 'alert' }, { a: 'l2', b: 'ben', k: 'ctrl' },
    ],
  };

  S['dirs-reload-refresh'] = {
    w: 680, h: 290, title: 'DIRS', caption: 'Reload+Refresh leaks through the replacement state, not the data: the victim\'s access changes which line the attacker loses next. DIRS keeps the data shared but gives each domain its own small replacement state, and proves the domains cannot see each other.',
    nodes: [
      { id: 'a', x: 20, y: 46, w: 110, h: 46, t: 'core 0', s: 'domain A' },
      { id: 'b', x: 20, y: 196, w: 110, h: 46, t: 'core 1', s: 'domain B', c: 'w' },
      { id: 'data', x: 220, y: 116, w: 150, h: 56, t: 'data array', s: 'still shared', k: 'chip' },
      { id: 'ra', x: 430, y: 46, w: 140, h: 46, t: 'replacement state A', c: 'b', k: 'chip' },
      { id: 'rb', x: 430, y: 196, w: 140, h: 46, t: 'replacement state B', c: 'w', k: 'chip' },
      { id: 'proof', x: 590, y: 120, w: 76, h: 48, t: 'k-induction', s: 'Yosys + Z3', k: 'pill', c: 'd' },
    ],
    links: [
      { a: 'a', b: 'data', n: 3 }, { a: 'b', b: 'data', n: 3 }, { a: 'data', b: 'ra', k: 'ctrl' }, { a: 'data', b: 'rb', k: 'ctrl' },
      { a: 'rb', b: 'ra', k: 'block', as: 't', bs: 'b', t: 'victim choice' }, { a: 'proof', b: 'ra', k: 'ctrl', as: 't', bs: 'r' }, { a: 'proof', b: 'rb', k: 'ctrl', as: 'b', bs: 'r' },
    ],
  };

  S['memory-security-review'] = {
    w: 680, h: 280, title: 'Memory security, from cold boot to side channels', caption: 'Memory can be frozen and read, sniffed on the bus, replayed, or attacked through the power drawn by the very engine that encrypts it. The review follows each attack to the defences built against it.',
    nodes: [
      { id: 'cpu', x: 20, y: 110, w: 110, h: 60, t: 'CPU', s: 'keys inside', k: 'chip' },
      { id: 'enc', x: 186, y: 110, w: 130, h: 60, t: 'TME · SME · SEV', s: 'encrypt on the way out', c: 'b' },
      { id: 'mt', x: 186, y: 210, w: 130, h: 44, t: 'Merkle trees', s: 'integrity, anti-replay', c: 'b' },
      { id: 'bus', x: 370, y: 110, w: 100, h: 60, t: 'memory bus', k: 'pill' },
      { id: 'dram', x: 530, y: 100, w: 128, h: 80, t: 'DRAM / NVM', k: 'mem' },
      { id: 'cold', x: 540, y: 20, w: 110, h: 44, t: 'cold boot', c: 'w' },
      { id: 'snf', x: 370, y: 20, w: 110, h: 44, t: 'bus sniffing', c: 'w' },
      { id: 'dpa', x: 186, y: 20, w: 130, h: 44, t: 'power analysis', s: 'masking, rekeying', c: 'w' },
    ],
    links: [
      { a: 'cpu', b: 'enc', n: 3 }, { a: 'enc', b: 'bus', t: 'ciphertext', n: 3 }, { a: 'bus', b: 'dram', n: 3 }, { a: 'enc', b: 'mt', k: 'ctrl', as: 'b', bs: 't' },
      { a: 'cold', b: 'dram', k: 'block', as: 'b', bs: 't' }, { a: 'snf', b: 'bus', k: 'block', as: 'b', bs: 't' }, { a: 'dpa', b: 'enc', k: 'block', as: 'b', bs: 't' },
    ],
  };

  S['cmo-coherency-smartcom'] = {
    w: 680, h: 280, title: 'Software-managed coherency, verified', caption: 'When a DMA engine bypasses the cache, the program must clean or invalidate lines at exactly the right moments. The paper proves when that is safe, then removes the cache maintenance that is not needed: 58.8% fewer operations on six benchmarks.',
    nodes: [
      { id: 'cpu', x: 20, y: 110, w: 110, h: 56, t: 'CPU', s: 'load / store' },
      { id: 'cache', x: 190, y: 104, w: 150, h: 68, t: 'cache line', s: 'Invalid · Clean · Dirty', k: 'chip' },
      { id: 'cmo', x: 190, y: 20, w: 150, h: 46, t: 'CBO.CLEAN / INVAL / FLUSH', s: 'Zicbom', c: 'b' },
      { id: 'mem', x: 410, y: 104, w: 110, h: 68, t: 'memory', k: 'mem' },
      { id: 'dma', x: 560, y: 104, w: 100, h: 68, t: 'DMA engine', s: 'bypasses the cache', c: 'w' },
      { id: 'ver', x: 190, y: 214, w: 150, h: 46, t: 'monitor + dataflow', s: 'safe, and 58.8% fewer CMOs', c: 'b', k: 'pill' },
    ],
    links: [
      { a: 'cpu', b: 'cache', n: 3 }, { a: 'cache', b: 'mem', t: 'write back', n: 2 }, { a: 'dma', b: 'mem', n: 3, t: 'read / write' }, { a: 'cmo', b: 'cache', k: 'ctrl', as: 'b', bs: 't' },
      { a: 'ver', b: 'cache', k: 'ctrl', as: 't', bs: 'b' }, { a: 'dma', b: 'ver', k: 'block', as: 'b', bs: 'r', bend: 0.5, t: 'unsafe DMA caught' },
    ],
  };

  S['rv-josh-smartcom'] = {
    w: 680, h: 300, title: 'RV-JOSH', caption: 'An operating system whose kernel is Java, on bare-metal RISC-V. Every program is checked twice for malware, once from its bytecode and once from how it runs, and its pages are encrypted with keys from a PUF.',
    nodes: [
      { id: 'cls', x: 20, y: 40, w: 110, h: 46, t: 'class file', s: 'a new process', c: 'd' },
      { id: 'st', x: 176, y: 40, w: 150, h: 46, t: 'static detector', s: 'opcode n-grams · RF / NN', c: 'b' },
      { id: 'jvm', x: 176, y: 126, w: 150, h: 56, t: 'Java kernel on a JVM', s: 'JNI to C and assembly' },
      { id: 'pmu', x: 380, y: 126, w: 120, h: 56, t: '10 QEMU monitors', s: 'branches, jumps, syscalls…', k: 'chip' },
      { id: 'rt', x: 540, y: 126, w: 120, h: 56, t: 'runtime detector', s: 'HMM · LSTM · iForest', c: 'b' },
      { id: 'enc', x: 176, y: 222, w: 150, h: 50, t: 'page encryption', s: 'AES · ASCON · ChaCha', c: 'b', k: 'chip' },
      { id: 'puf', x: 20, y: 222, w: 110, h: 50, t: 'PUF keys', k: 'pill', c: 'd' },
      { id: 'ram', x: 380, y: 222, w: 120, h: 50, t: 'guest memory', s: 'no plaintext', k: 'mem' },
    ],
    links: [
      { a: 'cls', b: 'st', n: 2 }, { a: 'st', b: 'jvm', as: 'b', bs: 't', t: 'allowed' }, { a: 'jvm', b: 'pmu', n: 3 }, { a: 'pmu', b: 'rt', n: 3 },
      { a: 'jvm', b: 'enc', as: 'b', bs: 't' }, { a: 'puf', b: 'enc', k: 'ctrl' }, { a: 'enc', b: 'ram', n: 3 },
    ],
  };

  S['cache-spec-review-ict4sd'] = {
    w: 680, h: 290, title: 'Cache and speculative side channels', caption: 'The review starts from the hardware features that leak, groups the attacks into families, and maps each family to the defences that answer it.',
    groups: [{ x: 14, y: 14, w: 196, h: 262, t: 'what leaks' }, { x: 232, y: 14, w: 210, h: 262, t: 'attack families' }, { x: 464, y: 14, w: 202, h: 262, t: 'defences' }],
    nodes: [
      { id: 'f1', x: 30, y: 40, w: 164, h: 34, t: 'out-of-order + speculation', c: 'd' }, { id: 'f2', x: 30, y: 88, w: 164, h: 34, t: 'branch target buffer', c: 'd' },
      { id: 'f3', x: 30, y: 136, w: 164, h: 34, t: 'return stack buffer', c: 'd' }, { id: 'f4', x: 30, y: 184, w: 164, h: 34, t: 'store-to-load forwarding', c: 'd' }, { id: 'f5', x: 30, y: 232, w: 164, h: 34, t: 'shared caches', c: 'd' },
      { id: 'a1', x: 250, y: 50, w: 174, h: 44, t: 'Flush+Reload, Prime+Probe', c: 'w' }, { id: 'a2', x: 250, y: 120, w: 174, h: 44, t: 'Meltdown, Spectre', c: 'w' }, { id: 'a3', x: 250, y: 190, w: 174, h: 52, t: 'GoFetch, value prediction,\nGPU and TEE attacks', c: 'w' },
      { id: 'd1', x: 482, y: 44, w: 166, h: 34, t: 'partitioning, isolation', c: 'b' }, { id: 'd2', x: 482, y: 92, w: 166, h: 34, t: 'randomisation', c: 'b' }, { id: 'd3', x: 482, y: 140, w: 166, h: 34, t: 'fences, microcode', c: 'b' },
      { id: 'd4', x: 482, y: 188, w: 166, h: 34, t: 'compiler hardening', c: 'b' }, { id: 'd5', x: 482, y: 236, w: 166, h: 30, t: 'ML detection', c: 'b' },
    ],
    links: [
      { a: 'f5', b: 'a1', k: 'leak', n: 2 }, { a: 'f1', b: 'a2', k: 'leak', n: 2 }, { a: 'f2', b: 'a2', k: 'leak', n: 1 }, { a: 'f3', b: 'a2', k: 'leak', n: 1 }, { a: 'f4', b: 'a3', k: 'leak', n: 2 },
      { a: 'a1', b: 'd1', n: 2 }, { a: 'a1', b: 'd2', n: 1 }, { a: 'a2', b: 'd3', n: 2 }, { a: 'a2', b: 'd4', n: 1 }, { a: 'a3', b: 'd5', n: 2 },
    ],
  };

  S['riscv-hw-security-review-ict4sd'] = {
    w: 680, h: 300, title: 'A hardware security review of RISC-V', caption: 'Ten real RISC-V implementations, seven areas of attack, and what the open ecosystem already has against each.',
    nodes: [
      { id: 'core', x: 270, y: 112, w: 140, h: 76, t: '10 RISC-V cores', s: 'BOOM, CVA6, Rocket,\nShakti, XiangShan…', k: 'chip' },
      { id: 'a1', x: 30, y: 30, w: 160, h: 36, t: 'cache and speculation', c: 'w' }, { id: 'a2', x: 30, y: 132, w: 160, h: 36, t: 'power: SPA, DPA, CPA', c: 'w' }, { id: 'a3', x: 30, y: 234, w: 160, h: 36, t: 'fault injection (EM)', c: 'w' },
      { id: 'b1', x: 490, y: 22, w: 170, h: 36, t: 'TEEs: Sanctum, Dorami', c: 'b' }, { id: 'b2', x: 490, y: 82, w: 170, h: 36, t: 'secure boot, PUF roots', c: 'b' },
      { id: 'b3', x: 490, y: 142, w: 170, h: 36, t: 'crypto ISA, PQC', c: 'b' }, { id: 'b4', x: 490, y: 202, w: 170, h: 36, t: 'memory encryption', c: 'b' }, { id: 'b5', x: 490, y: 256, w: 170, h: 30, t: 'masking, hiding', c: 'b' },
    ],
    links: [
      { a: 'a1', b: 'core', k: 'leak', n: 2 }, { a: 'a2', b: 'core', k: 'leak', n: 2 }, { a: 'a3', b: 'core', k: 'leak', n: 2 },
      { a: 'core', b: 'b1', n: 1 }, { a: 'core', b: 'b2', n: 1 }, { a: 'core', b: 'b3', n: 1 }, { a: 'core', b: 'b4', n: 1 }, { a: 'core', b: 'b5', n: 1 },
    ],
  };

  S['modern-hw-security-arxiv'] = {
    w: 680, h: 300, title: 'Modern hardware security', caption: 'Hardware security in layers, from the physics of the chip up to the code that boots it, with the attacks that cross each layer and the countermeasures that stop them.',
    nodes: [
      { id: 'l1', x: 180, y: 20, w: 320, h: 40, t: 'secure boot · root of trust · PUFs', c: 'b' },
      { id: 'l2', x: 180, y: 76, w: 320, h: 40, t: 'secure enclaves · cryptographic ISAs', c: 'b' },
      { id: 'l3', x: 180, y: 132, w: 320, h: 40, t: 'memory encryption · integrity', c: 'b' },
      { id: 'l4', x: 180, y: 188, w: 320, h: 40, t: 'caches · speculative execution', c: 'b' },
      { id: 'l5', x: 180, y: 244, w: 320, h: 40, t: 'power · EM · faults', c: 'b' },
      { id: 'x1', x: 20, y: 82, w: 120, h: 40, t: 'enclave attacks', c: 'w' }, { id: 'x2', x: 20, y: 190, w: 120, h: 40, t: 'Spectre, Meltdown', c: 'w' },
      { id: 'x3', x: 540, y: 136, w: 120, h: 40, t: 'cold boot, bus', c: 'w' }, { id: 'x4', x: 540, y: 246, w: 120, h: 40, t: 'DPA, glitching', c: 'w' },
    ],
    links: [
      { a: 'x1', b: 'l2', k: 'block' }, { a: 'x2', b: 'l4', k: 'block' }, { a: 'x3', b: 'l3', k: 'block' }, { a: 'x4', b: 'l5', k: 'block' },
      { a: 'l5', b: 'l4', k: 'ctrl' }, { a: 'l4', b: 'l3', k: 'ctrl' }, { a: 'l3', b: 'l2', k: 'ctrl' }, { a: 'l2', b: 'l1', k: 'ctrl' },
    ],
  };

  S['drebin-duplicates-apcc'] = {
    w: 680, h: 280, title: 'Duplicates in Drebin', caption: 'Half the malicious samples in Drebin had near-copies. Left in, the copies leak between training and testing and make detectors look better than they are; taken out, accuracy fell by 4.2% to 12.2%.',
    nodes: [
      { id: 'd', x: 20, y: 100, w: 120, h: 80, t: 'Drebin', s: 'Android apps', k: 'mem' },
      { id: 'ff', x: 186, y: 106, w: 130, h: 68, t: 'fitting factor', s: 'on opcode counts', c: 'b' },
      { id: 'dup', x: 366, y: 30, w: 130, h: 54, t: '51.57%', s: 'of malware duplicated', c: 'w', k: 'pill' },
      { id: 'cl', x: 366, y: 196, w: 130, h: 54, t: 'deduplicated set', c: 'b' },
      { id: 'm', x: 540, y: 106, w: 120, h: 68, t: 'RF, DT, XGBoost,\nDNN…', s: 'retrained' },
    ],
    links: [
      { a: 'd', b: 'ff', n: 4 }, { a: 'ff', b: 'dup', k: 'leak', n: 3 }, { a: 'ff', b: 'cl', n: 3 }, { a: 'dup', b: 'm', k: 'block', t: 'train/test leak' }, { a: 'cl', b: 'm', n: 3, t: 'honest score' },
    ],
    notes: [{ x: 662, y: 200, t: 'accuracy down 4.2% to 12.2%', c: 'w', a: 'end' }],
  };
})();
