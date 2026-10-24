/* Dialog forms: job add/edit, completion with replacement lines, cancel, status change, conflict, Admin dialogs.
   Every submit goes through EQ.api (the simulated server rules). Nothing is persisted beyond the page view. */
window.EQ = window.EQ || {};
(function (EQ) {
  const h = EQ.h, icon = EQ.icon;
  const S = () => EQ.state;

  // ---------- toasts ----------
  EQ.toast = (msg, sub) => {
    let host = document.getElementById('toasts');
    if (!host) { host = h('div', { id: 'toasts', class: 'toasts', role: 'status', 'aria-live': 'polite' }); document.body.appendChild(host); }
    const t = h('div', { class: 'toast' }, icon('info'), h('div', null, msg, sub ? h('small', null, sub) : null));
    host.appendChild(t);
    setTimeout(() => t.remove(), 6500);
  };
  const PROTO_NOTE = 'Prototype: kept in memory for this page view only, not saved.';

  // ---------- field helpers ----------
  function field(id, label, control, o = {}) {
    const hintId = id + '-hint', errId = id + '-err';
    const desc = [];
    if (o.hint) desc.push(hintId);
    if (o.error) { desc.push(errId); control.setAttribute('aria-invalid', 'true'); }
    control.id = id; control.dataset.fk = id;
    if (desc.length) control.setAttribute('aria-describedby', desc.join(' '));
    if (o.required) control.setAttribute('aria-required', 'true');
    return h('div', { class: 'field' },
      h('label', { for: id, class: o.required ? 'req' : '' }, label),
      control,
      o.hint ? h('div', { class: 'hint', id: hintId }, o.hint) : null,
      o.error ? h('div', { class: 'err', id: errId }, icon('alert'), o.error) : null);
  }
  const input = (st, key, attrs, onchg) => {
    const el = h('input', { type: 'text', ...attrs, value: st[key] == null ? '' : st[key] });
    el.addEventListener('input', () => { st[key] = el.value; if (onchg) onchg(); });
    return el;
  };
  const area = (st, key, attrs) => {
    const el = h('textarea', attrs, st[key] || '');
    el.addEventListener('input', () => { st[key] = el.value; });
    return el;
  };
  const select = (st, key, options, rerender, placeholder) => {
    const el = h('select', null,
      placeholder != null ? h('option', { value: '' }, placeholder) : null,
      options.map((o) => (o.group ? h('optgroup', { label: o.group }, o.items.map((i) => h('option', { value: i.value, selected: st[key] === i.value ? true : null }, i.label))) : h('option', { value: o.value, selected: st[key] === o.value ? true : null }, o.label))));
    el.addEventListener('change', () => { st[key] = el.value; if (rerender) rerender(); });
    return el;
  };
  const radios = (st, key, name, opts, rerender, legend, error) => h('fieldset', { 'aria-describedby': error ? name + '-err' : null },
    h('legend', null, legend),
    h('div', { class: 'row' }, opts.map((o) => h('label', { class: 'check' }, h('input', { type: 'radio', name, id: name + '-' + o.value, value: o.value, checked: st[key] === o.value ? true : null, 'data-fk': name + '-' + o.value, onChange: () => { st[key] = o.value; if (rerender) rerender(); } }), o.label))),
    error ? h('div', { class: 'err', id: name + '-err' }, icon('alert'), error) : null);

  function errorSummary(items) {
    if (!items.length) return null;
    return h('div', { class: 'err-summary', role: 'alert', tabindex: '-1', id: 'err-summary' },
      h('strong', null, 'Nothing was saved. ' + EQ.plural(items.length, 'item') + ' need attention:'),
      h('ul', null, items.map(([id, msg]) => h('li', null, h('a', { href: '#' + id, onClick: (e) => { e.preventDefault(); document.getElementById(id)?.focus(); } }, msg)))));
  }

  // ---------- dialog shell ----------
  /** Keep Tab/Shift+Tab inside a modal dialog (wraps first <-> last focusable). */
  function trapFocus(dlg, onEscape) {
    dlg.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && onEscape) { e.preventDefault(); e.stopPropagation(); onEscape(); return; }
      if (e.key !== 'Tab') return;
      const f = [...dlg.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]')].filter((x) => x.offsetParent !== null || x === document.activeElement);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || !dlg.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || !dlg.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
    });
  }
  function openDialog(spec) {
    const dlg = h('dialog', { 'aria-labelledby': 'dlg-title' });
    let dirty = false;
    const api = {
      dlg, markDirty() { dirty = true; },
      close(result) { dlg.close(); dlg.remove(); if (spec.onClosed) spec.onClosed(result); },
      requestClose() {
        if (dirty && !spec.noGuard) {
          confirmDialog({ title: 'Discard unsaved changes?', message: 'You have entered data that has not been submitted. Closing now discards it.', confirmLabel: 'Discard changes', cancelLabel: 'Keep editing', danger: true }).then((ok) => { if (ok) api.close(); });
        } else api.close();
      },
      render() {
        const fk = document.activeElement && dlg.contains(document.activeElement) ? document.activeElement.dataset.fk : null;
        const pos = dlg.querySelector('.dlg-body')?.scrollTop || 0;
        const parts = spec.build(api);
        dlg.replaceChildren(h('div', { class: 'dlg' },
          h('div', { class: 'dlg-head' }, h('h2', { id: 'dlg-title' }, parts.title), h('button', { type: 'button', class: 'btn-sm', 'aria-label': 'Close dialog', onClick: () => api.requestClose() }, icon('x'))),
          h('div', { class: 'dlg-body' }, parts.body),
          h('div', { class: 'dlg-foot' }, parts.foot)));
        const b = dlg.querySelector('.dlg-body'); if (b) b.scrollTop = pos;
        if (parts.focusSummary) document.getElementById('err-summary')?.focus();
        else if (fk) dlg.querySelector('[data-fk="' + fk + '"]')?.focus();
      },
    };
    dlg.addEventListener('cancel', (e) => { e.preventDefault(); api.requestClose(); });
    trapFocus(dlg, () => api.requestClose());
    document.body.appendChild(dlg);
    api.render();
    dlg.showModal();
    if (!dlg.querySelector(':focus')) (dlg.querySelector('[data-fk]') || dlg.querySelector('button'))?.focus();
    return api;
  }
  function confirmDialog({ title, message, confirmLabel, cancelLabel, danger }) {
    return new Promise((resolve) => {
      const dlg = h('dialog', { 'aria-labelledby': 'cd-title', style: 'width:min(460px,calc(100vw - 1.5rem))' });
      const done = (v) => { dlg.close(); dlg.remove(); resolve(v); };
      dlg.addEventListener('cancel', (e) => { e.preventDefault(); done(false); });
      trapFocus(dlg, () => done(false));
      dlg.appendChild(h('div', { class: 'dlg' },
        h('div', { class: 'dlg-head' }, h('h2', { id: 'cd-title' }, title)),
        h('div', { class: 'dlg-body' }, h('p', { style: 'margin:0' }, message)),
        h('div', { class: 'dlg-foot' },
          h('button', { type: 'button', onClick: () => done(false), autofocus: true }, cancelLabel || 'Cancel'),
          h('button', { type: 'button', class: danger ? 'danger-btn' : 'primary', onClick: () => done(true) }, confirmLabel || 'Confirm'))));
      document.body.appendChild(dlg); dlg.showModal();
    });
  }
  EQ.confirm = confirmDialog;

  function footButtons(api, submitLabel, onSubmit, opts = {}) {
    return [
      h('button', { type: 'button', onClick: () => api.requestClose() }, 'Cancel'),
      h('button', { type: 'submit', class: opts.danger ? 'danger-btn' : 'primary', 'data-fk': 'submit', disabled: opts.busy ? true : null, onClick: (e) => { e.preventDefault(); onSubmit(); } }, opts.busy ? 'Working...' : submitLabel),
    ];
  }
  const writerGuard = () => (!EQ.perm.write() ? h('div', { class: 'notice warn' }, icon('lock'), h('p', null, 'Read-only access (Management). The server refuses this action for your role.')) : null);

  // ---------- job add / edit ----------
  EQ.dlg = {};
  EQ.dlg.jobForm = function jobForm({ job, equipmentId, prefill }) {
    const editing = !!job;
    const st = editing
      ? { equipmentId: job.equipmentId, level: job.level, mainId: job.mainId, subId: job.subId, positionId: job.positionId, kind: job.kind, title: job.title, description: job.description, priority: job.priority || '', plannedOn: job.plannedOn || '', responsible: job.responsible || '', initialStatus: 'pending', version: job.version }
      : { equipmentId: equipmentId || '', level: 'equipment', mainId: '', subId: '', positionId: '', kind: '', title: '', description: '', priority: '', plannedOn: '', responsible: '', initialStatus: 'pending' };
    if (!editing && prefill) {
      st.level = prefill.part ? 'part' : prefill.sub ? 'sub' : prefill.main ? 'main' : 'equipment';
      st.mainId = prefill.main || ''; st.subId = prefill.sub || ''; st.positionId = prefill.part || '';
      const pp = prefill.part && EQ.pos(prefill.part); if (pp && pp.kind) st.kind = '';
    }
    let errors = {}, summary = [], busy = false, conflict = null;
    const api = openDialog({
      build(api) {
        const eq = EQ.eq(st.equipmentId);
        const mains = eq ? eq.mains.map((m) => ({ value: m.id, label: m.code + '  ' + EQ.defLabel(m.code) })) : [];
        const subsOf = eq ? eq.subs.filter((s) => !st.mainId || s.mainId === st.mainId).map((s) => ({ value: s.id, label: s.code + '  ' + EQ.defLabel(s.code) })) : [];
        const positions = eq ? EQ.positionsOf(eq.id).filter((p) => p.state === 'active' && (!st.subId || p.subId === st.subId) && (!st.mainId || p.mainId === st.mainId)).map((p) => ({ value: p.id, label: p.name })) : [];
        const dirtyCb = () => api.markDirty();
        const body = [
          writerGuard(),
          conflict ? conflictPanel(conflict, st, () => { conflict = null; api.render(); }) : null,
          errorSummary(summary),
          editing ? h('div', { class: 'notice info' }, icon('info'), h('p', null, 'Editing ' + job.number + ' (version ' + st.version + '). Equipment, number and creator cannot change.')) : null,
          h('div', { class: 'grid-2', onInput: dirtyCb, onChange: dirtyCb },
            field('jf-equipment', 'Equipment', editing ? h('select', { disabled: true }, h('option', null, eq.code)) : select(st, 'equipmentId', S().D.equipment.filter((e) => e.lifecycle === 'active').map((e) => ({ value: e.id, label: e.code + (e.assoc === 'verified' ? '' : ' (no verified model)') })), () => { st.mainId = st.subId = st.positionId = ''; st.level = 'equipment'; api.render(); }, 'Choose equipment'), { required: true, error: errors.equipmentId }),
            radios(st, 'kind', 'jf-kind', [{ value: 'repair', label: 'Repair' }, { value: 'replacement', label: 'Replacement' }], null, 'Kind *', errors.kind)),
          field('jf-title', 'Title', input(st, 'title', { maxlength: 200, autocomplete: 'off' }, dirtyCb), { required: true, error: errors.title, hint: 'What will be done, in a few words.' }),
          field('jf-desc', 'Description', area(st, 'description', { maxlength: 4000, rows: 3 }), { hint: 'Optional. Do not enter secrets or personal data.' }),
          h('fieldset', null,
            h('legend', null, 'Scope target'),
            h('div', { class: 'stack' },
              radios(st, 'level', 'jf-level', [{ value: 'equipment', label: 'Whole equipment' }, { value: 'main', label: 'Main mechanism' }, { value: 'sub', label: 'Submechanism' }, { value: 'part', label: 'Part position' }], () => {
                if (st.level === 'equipment') st.mainId = st.subId = st.positionId = '';
                if (st.level === 'main') st.subId = st.positionId = '';
                if (st.level === 'sub') st.positionId = '';
                api.render();
              }, 'Level'),
              !eq ? h('p', { class: 'muted small' }, 'Choose equipment first.') : null,
              eq && st.level === 'equipment' ? h('p', { class: 'muted small' }, "Applies to the whole equipment, with no component target. It appears once at equipment level.") : null,
              eq && eq.mains.length === 0 && st.level !== 'equipment' ? h('div', { class: 'notice warn' }, icon('alert'), h('p', null, eq.code + ' has no mechanism instances: it has no verified model association or no instantiated template. Only equipment-level jobs are possible.')) : null,
              eq && st.level !== 'equipment' && eq.mains.length ? h('div', { class: 'grid-2' },
                field('jf-main', 'Main mechanism', select(st, 'mainId', mains, () => { st.subId = st.positionId = ''; api.render(); }, 'Choose main mechanism'), { required: st.level !== 'equipment', error: errors.target && st.level === 'main' ? errors.target : null }),
                st.level === 'sub' || st.level === 'part' ? field('jf-sub', 'Submechanism', select(st, 'subId', subsOf, () => { const s = eq.subs.find((x) => x.id === st.subId); if (s) st.mainId = s.mainId; st.positionId = ''; api.render(); }, 'Choose submechanism'), { required: true, error: errors.target && st.level === 'sub' ? errors.target : null }) : null,
                st.level === 'part' ? field('jf-part', 'Part position', select(st, 'positionId', positions, () => { const p = EQ.pos(st.positionId); if (p) { st.mainId = p.mainId; st.subId = p.subId; } api.render(); }, positions.length ? 'Choose part position' : 'No active positions here'), { required: true, error: errors.target && st.level === 'part' ? errors.target : null, hint: 'Only confirmed (active) positions of ' + eq.code + ' are offered. Draft positions cannot be targeted.' }) : null) : null)),
          h('div', { class: 'grid-2', onInput: dirtyCb, onChange: dirtyCb },
            field('jf-planned', 'Planned date', h('input', { type: 'date', value: st.plannedOn, min: '2000-01-01', onInput: (e) => { st.plannedOn = e.target.value; } }), { error: errors.plannedOn, hint: 'If known.' }),
            field('jf-prio', 'Priority', select(st, 'priority', [{ value: 'low', label: 'Low' }, { value: 'normal', label: 'Normal' }, { value: 'high', label: 'High' }], null, 'Not set'), { hint: 'Simple optional field; no approval workflow.' }),
            field('jf-resp', 'Responsible person', input(st, 'responsible', { maxlength: 200 }), { hint: 'Optional.' }),
            !editing ? radios(st, 'initialStatus', 'jf-init', [{ value: 'pending', label: 'Pending' }, { value: 'current', label: 'Current (started)' }], null, 'Initial work status') : null),
          h('p', { class: 'muted small' }, PROTO_NOTE),
        ];
        return { title: editing ? 'Edit job ' + job.number : 'Add special job', body, focusSummary: summary.length > 0, foot: footButtons(api, editing ? 'Save changes' : 'Create job', submit, { busy }) };
      },
    });
    function submit() {
      if (busy) return;
      busy = true; api.render();
      setTimeout(() => {
        busy = false;
        const payload = { ...st, level: st.level };
        const res = editing ? EQ.api.updateJob(job.id, payload) : EQ.api.createJob(payload);
        if (res.ok) { api.close(res); EQ.toast((editing ? 'Job saved: ' : 'Job created: ') + res.job.number, PROTO_NOTE); if (!editing && EQ.onJobCreated) EQ.onJobCreated(res.job); return; }
        if (res.code === 'version_conflict') { conflict = res; errors = {}; summary = []; api.render(); return; }
        errors = res.fields || {};
        summary = Object.entries(errors).map(([k, m]) => [fieldId(k), m]);
        if (!summary.length) summary = [['submit', res.message]];
        api.render();
      }, 350);
    }
    const fieldId = (k) => ({ equipmentId: 'jf-equipment', kind: 'jf-kind-repair', title: 'jf-title', plannedOn: 'jf-planned', target: st.level === 'part' ? 'jf-part' : st.level === 'sub' ? 'jf-sub' : 'jf-main' }[k] || 'submit');
    return api;
  };

  function conflictPanel(res, mine, dismiss) {
    const cur = res.current;
    const rows = [['Title', mine.title, cur.title], ['Planned date', mine.plannedOn || '(none)', cur.plannedOn || '(none)'], ['Description', mine.description || '(empty)', cur.description || '(empty)']];
    return h('div', { class: 'notice error', role: 'alert' }, icon('alert'), h('div', null,
      h('p', null, h('strong', null, 'Conflict (409 version_conflict). '), res.message),
      h('div', { class: 'diff', style: 'margin-top:.5rem' }, h('span', { class: 'h' }, 'Field'), h('span', { class: 'h' }, 'Your edit'), h('span', { class: 'h' }, 'Current saved value'),
        rows.map(([k, a, b]) => [h('span', null, k), h('span', { class: a !== b ? 'chg' : '' }, a), h('span', { class: a !== b ? 'chg' : '' }, b)])),
      h('div', { class: 'actions' },
        h('button', { type: 'button', class: 'btn-sm', onClick: () => { mine.version = cur.version; dismiss(); } }, 'Keep my edits on the current version'),
        h('button', { type: 'button', class: 'btn-sm', onClick: () => { mine.title = cur.title; mine.plannedOn = cur.plannedOn || ''; mine.description = cur.description || ''; mine.version = cur.version; dismiss(); } }, 'Reload current values'))));
  }

  // ---------- completion ----------
  EQ.dlg.complete = function complete(job, afterDone) {
    const eq = EQ.eq(job.equipmentId);
    const st = { completedOn: EQ.todayColombo(), note: '', lines: [], key: crypto.randomUUID ? crypto.randomUUID() : 'key-' + Date.now() };
    let errors = {}, lineErrors = {}, summary = [], busy = false, result = null;
    const eligible = () => EQ.positionsOf(eq.id).filter((p) => p.state === 'active' && EQ.inTarget(job, p));
    const blankLine = () => { const el = eligible(); const only = job.level === 'part' ? el[0] : null; return { positionId: only ? only.id : '', removedKnown: 'unknown', removedDesc: '', removedSerial: '', desc: '', mfr: '', partNo: '', serial: '', qty: '1', on: EQ.todayColombo(), note: '' }; };
    if (job.kind === 'replacement') st.lines.push(blankLine());
    const api = openDialog({
      build(api) {
        const dirty = () => api.markDirty();
        const body = [
          writerGuard(),
          errorSummary(summary),
          h('div', { class: 'notice info' }, icon('info'), h('p', null, h('strong', null, job.number + ' - ' + job.title), h('br'), 'Target: ' + EQ.targetLabel(job) + '. Kind: ' + (job.kind === 'replacement' ? 'Replacement' : 'Repair') + '.')),
          h('div', { class: 'notice warn' }, icon('alert'), h('p', null, 'Completing this job does not change the equipment status. ' + eq.code + ' stays ' + EQ.STATUS[EQ.statusKey(eq.status)].label + '.')),
          h('div', { class: 'grid-2', onInput: dirty },
            field('cf-date', 'Actual completion date', h('input', { type: 'date', min: '2000-01-01', max: EQ.todayColombo(), value: st.completedOn, onInput: (e) => { st.completedOn = e.target.value; } }), { required: true, error: errors.completedOn, hint: "Work date in Asia/Colombo. The audit timestamp is recorded separately in UTC." }),
            field('cf-note', 'Completion note', area(st, 'note', { rows: 3, maxlength: 2000 }), { required: true, error: errors.note })),
          job.kind === 'repair' ? h('p', { class: 'muted small' }, 'Repair jobs take no replacement lines.')
            : h('section', { class: 'stack', 'aria-labelledby': 'cf-lines-h' },
              h('div', { class: 'row between' }, h('h3', { id: 'cf-lines-h' }, 'Replacement lines'), h('button', { type: 'button', class: 'btn-sm', onClick: () => { st.lines.push(blankLine()); dirty(); api.render(); } }, icon('plus'), 'Add line')),
              errors.lines ? h('div', { class: 'field' }, h('div', { class: 'err' }, icon('alert'), errors.lines)) : null,
              st.lines.map((l, i) => lineCard(l, i, api, dirty))),
          h('fieldset', null, h('legend', null, 'Work evidence'), h('p', { class: 'muted small', style: 'margin:0' }, "JPEG, PNG or PDF, up to 20 MiB per file. Upload is not available in this prototype.")),
          h('p', { class: 'muted small' }, "Recorded once, even if you click twice or retry. " + PROTO_NOTE),
        ];
        return { title: 'Complete job ' + job.number, body, focusSummary: summary.length > 0, foot: footButtons(api, 'Complete job', submit, { busy }) };
      },
    });
    function lineCard(l, i, api, dirty) {
      const le = lineErrors[i] || {};
      const pos = EQ.pos(l.positionId);
      const groups = {};
      eligible().forEach((p) => { const s = eq.subs.find((x) => x.id === p.subId); const g = s ? s.code + ' ' + EQ.defLabel(s.code) : 'Other'; (groups[g] = groups[g] || []).push({ value: p.id, label: p.name + '  [' + p.key + ']' }); });
      const opts = Object.entries(groups).map(([g, items]) => ({ group: g, items }));
      const cur = pos ? S().D.events.filter((e) => e.positionId === pos.id && !e.voided).slice(-1)[0] : null;
      const k = 'cl' + i;
      return h('div', { class: 'line-card', onInput: dirty, onChange: dirty },
        h('div', { class: 'row between' }, h('strong', null, 'Line ' + (i + 1)), st.lines.length > 1 || job.kind !== 'replacement' ? h('button', { type: 'button', class: 'btn-sm', onClick: () => { st.lines.splice(i, 1); lineErrors = {}; api.render(); } }, icon('x'), 'Remove') : null),
        field(k + '-pos', 'Replaced position', select(l, 'positionId', opts, () => { const p = EQ.pos(l.positionId); if (p && p.kind === 'serialized') l.qty = '1'; api.render(); }, 'Choose position'), { required: true, error: le.positionId, hint: eligible().length ? 'Positions of ' + eq.code + ' inside the job target only. Each position can have one line per job.' : 'This job has no active positions in its target.' }),
        pos ? h('div', { class: 'notice info' }, icon('info'), h('p', null, pos.kind === 'serialized' ? 'Serialized position: quantity is fixed at 1 ea.' : 'Quantity-bearing position (' + pos.uom + '): enter the quantity installed. This is not treated as one serialized item.', h('br'),
          cur ? 'Tracked current item: ' + cur.installed.desc + (cur.installed.serial ? ' (serial ' + cur.installed.serial + ')' : ' (serial unknown)') + ' will be recorded as removed.' : 'No tracked installation at this position. The removed item may be recorded as Unknown; nothing is invented.')) : null,
        pos && EQ.spares.isMajor(pos.id) ? h('div', { class: 'notice info', 'data-fk-note': 'spare' }, icon('info'), h('p', null, h('strong', null, 'Major spare part. '), "Completing this replacement also updates the condition register with the manufacturer, model/part number, serial and replacement date.")) : null,
        radios(l, 'removedKnown', k + '-rk', [{ value: 'unknown', label: 'Removed item Unknown' }, { value: 'yes', label: 'Removed item known' }], () => api.render(), 'Removed item'),
        l.removedKnown === 'yes' ? h('div', { class: 'grid-2' }, field(k + '-rd', 'Removed item description', input(l, 'removedDesc', {}), { required: true, error: le.removedDesc }), field(k + '-rs', 'Removed serial', input(l, 'removedSerial', {}), { hint: 'Leave empty if unknown.' })) : null,
        field(k + '-desc', 'Installed item description', input(l, 'desc', {}), { required: true, error: le.desc }),
        h('div', { class: 'grid-2' },
          field(k + '-mfr', 'Manufacturer', input(l, 'mfr', {}), { hint: 'Optional.' }),
          field(k + '-pn', 'Model / part number', input(l, 'partNo', {}), { hint: 'Optional.' }),
          field(k + '-sn', 'Serial number', input(l, 'serial', {}), { hint: 'Leave empty if unknown. Never guessed.' }),
          field(k + '-qty', 'Quantity' + (pos ? ' (' + pos.uom + ')' : ''), input(l, 'qty', { inputmode: 'decimal', disabled: pos && pos.kind === 'serialized' ? true : null }), { required: true, error: le.qty }),
          field(k + '-on', 'Replacement date', h('input', { type: 'date', min: '2000-01-01', max: EQ.todayColombo(), value: l.on, onInput: (e) => { l.on = e.target.value; } }), { required: true, error: le.on, hint: 'Business date of the physical work.' }),
          field(k + '-note', 'Line note', input(l, 'note', {}), { hint: 'Optional.' }),
          pos && EQ.spares.isMajor(pos.id) ? field(k + '-cr', 'Condition remarks (register)', input(l, 'conditionRemarks', {}), { hint: 'Optional; shown in the spare-part register.' }) : null));
    }
    function submit() {
      if (busy) return;
      busy = true; api.render();
      setTimeout(() => {
        busy = false;
        const res = EQ.api.completeJob(job.id, { key: st.key, completedOn: st.completedOn, note: st.note, lines: st.lines.map((l) => ({ ...l, qty: l.qty })) });
        if (res.ok) {
          EQ.lastCompletion = { id: job.id, key: st.key, payload: { key: st.key } };
          api.close(res);
          EQ.toast('Completed ' + job.number + (res.replayed ? ' (replayed: no duplicate)' : ''), 'Equipment status unchanged: ' + EQ.STATUS[EQ.statusKey(res.statusUnchanged)].label + '. ' + PROTO_NOTE);
          if (afterDone) afterDone(res);
          return;
        }
        errors = res.fields || {}; lineErrors = res.lineErrors || {};
        summary = [];
        Object.entries(errors).forEach(([k, m]) => summary.push([{ completedOn: 'cf-date', note: 'cf-note', lines: 'cf-lines-h' }[k] || 'submit', m]));
        Object.entries(lineErrors).forEach(([i, e]) => Object.entries(e).forEach(([k, m]) => summary.push(['cl' + i + '-' + { positionId: 'pos', desc: 'desc', qty: 'qty', on: 'on', removedDesc: 'rd' }[k], 'Line ' + (Number(i) + 1) + ': ' + m])));
        if (!summary.length) summary = [['submit', res.message]];
        api.render();
      }, 400);
    }
    return api;
  };

  // ---------- cancel ----------
  EQ.dlg.cancel = function cancel(job) {
    const st = { reason: '' }; let err = null;
    const api = openDialog({
      build(api) {
        return {
          title: 'Cancel job ' + job.number,
          body: [writerGuard(), h('div', { class: 'notice warn' }, icon('alert'), h('p', null, "Cancellation cannot be undone. The job stays in history under Include cancelled, with who cancelled it and why. It is not deleted or counted as Completed.")),
            h('p', { style: 'margin:0' }, h('strong', null, job.title)),
            field('cc-reason', 'Reason for cancelling', area(st, 'reason', { rows: 3, maxlength: 500 }), { required: true, error: err, hint: 'Required, at least 3 characters.' })],
          focusSummary: false,
          foot: footButtons(api, 'Cancel this job', () => {
            const r = EQ.api.cancelJob(job.id, st.reason);
            if (r.ok) { api.close(r); EQ.toast('Cancelled ' + job.number, PROTO_NOTE); } else { err = (r.fields && r.fields.reason) || r.message; api.render(); document.getElementById('cc-reason')?.focus(); }
          }, { danger: true }),
        };
      },
    });
    return api;
  };

  // ---------- operational status ----------
  EQ.dlg.status = function status(eq) {
    const st = { status: '', reason: '', relatedJobId: '' }; let errors = {};
    const api = openDialog({
      build(api) {
        const jobs = EQ.jobsOf(eq.id).filter((j) => j.workStatus !== 'completed');
        return {
          title: (eq.zmmsMapped ? 'Correct operational status - ' : 'Update operational status - ') + eq.code,
          body: [writerGuard(),
            h('p', { style: 'margin:0' }, 'Current: ', EQ.statusBadge(eq.status), eq.status ? ' since ' + EQ.fmtInstantShort(eq.statusSince) : ' (never set, no duration shown)', ' · ', h('strong', null, EQ.zmms.mode(eq).long)),
            eq.zmmsMapped ? h('div', { class: 'notice warn' }, icon('clock'), h('div', { class: 'stack', style: 'gap:.3rem' }, h('p', null, h('strong', null, "Correction: "), "Add a reason. The status stays Manual through today's syncs."), h('p', null, h('strong', null, "Return to automatic: "), "At the next successful sync after today, or sooner with Back to automatic."))) : null,
            radios(st, 'status', 'sf-status', [{ value: 'readyForOps', label: 'Ready for OPS' }, { value: 'breakdown', label: 'Breakdown' }, { value: 'maintenance', label: 'Maintenance' }], () => api.render(), 'New status *', errors.status),
            field('sf-reason', 'Reason' + (!eq.zmmsMapped && st.status === 'readyForOps' ? ' (optional)' : ''), area(st, 'reason', { rows: 2, maxlength: 500 }), { required: eq.zmmsMapped || st.status === 'breakdown' || st.status === 'maintenance', error: errors.reason, hint: eq.zmmsMapped ? 'Mandatory for every correction of an automatic status.' : 'Mandatory for Breakdown and Maintenance.' }),
            field('sf-job', 'Related job (optional)', select(st, 'relatedJobId', jobs.map((j) => ({ value: j.id, label: j.number + ' ' + j.title })), null, 'None'), { hint: 'Only open jobs of ' + eq.code + ' are offered.' }),
            h('div', { class: 'notice info' }, icon('clock'), h('p', null, "Applies now; it cannot be backdated. Status duration uses recorded changes. " + PROTO_NOTE))],
          foot: footButtons(api, eq.zmmsMapped ? 'Correct status for today' : 'Set status', () => {
            const r = EQ.api.setStatus(eq.id, st);
            if (r.ok) { api.close(r); EQ.toast(eq.code + ' is now ' + EQ.STATUS[st.status].label, PROTO_NOTE); } else { errors = r.fields || { status: r.message }; api.render(); }
          }),
        };
      },
    });
    return api;
  };

  // ---------- Admin dialogs ----------
  EQ.dlg.newEquipment = function newEquipment() {
    const st = { code: '', name: '', typeCode: '' }; let errors = {};
    return openDialog({
      build(api) {
        return {
          title: 'Register equipment',
          body: [writerGuard(),
            h('div', { class: 'notice info' }, icon('info'), h('p', null, "New equipment starts Unreported, without a model, serial or commissioning date. An Admin must verify and assign its model.")),
            field('ne-code', 'Equipment code', input(st, 'code', { autocomplete: 'off', maxlength: 32 }, () => api.markDirty()), { required: true, error: errors.code, hint: 'Unique, not case-sensitive. Try QC-DEMO-01 to see the duplicate refusal.' }),
            field('ne-name', 'Name', input(st, 'name', { maxlength: 200 }), {}),
            field('ne-type', 'Type', select(st, 'typeCode', S().D.types.map((t) => ({ value: t.code, label: t.name })), null, 'Choose type'), { required: true, error: errors.typeCode, hint: 'Immutable after creation.' })],
          foot: footButtons(api, 'Register', () => {
            const r = EQ.api.createEquipment(st);
            if (r.ok) { api.close(r); EQ.toast('Registered ' + r.eq.code + ' (Unreported)', PROTO_NOTE); } else { errors = r.fields || {}; api.render(); }
          }),
        };
      },
    });
  };
  EQ.dlg.reason = function reason({ title, message, label, confirm, danger, onSubmit }) {
    const st = { reason: '' }; let err = null;
    return openDialog({
      build(api) {
        return {
          title, body: [writerGuard(), message ? h('p', { style: 'margin:0' }, message) : null, field('rs-reason', label || 'Reason', area(st, 'reason', { rows: 3 }), { required: true, error: err })],
          foot: footButtons(api, confirm || 'Confirm', () => {
            const r = onSubmit(st.reason);
            if (r.ok) { api.close(r); EQ.toast('Done', PROTO_NOTE); } else { err = (r.fields && r.fields.reason) || r.message; api.render(); document.getElementById('rs-reason')?.focus(); }
          }, { danger }),
        };
      },
    });
  };
  EQ.dlg.resolveParam = function resolveParam(p) {
    const st = { value: '', reason: '' }; let err = null, verr = null;
    return openDialog({
      build(api) {
        return {
          title: 'Resolve source conflict - ' + p.label,
          body: [h('div', { class: 'notice warn' }, icon('alert'), h('p', null, "Original observations stay visible. Your decision applies to this model only; past work and model history stay unchanged.")),
            h('ul', { style: 'margin:0;padding-left:1.1rem' }, p.observations.map((o) => h('li', null, o.value + ' ' + p.unit + ' - ' + o.drawing + ' p' + o.page + (o.supplementary ? ' (supplementary observation, U-02)' : '')))),
            field('rp-val', 'Chosen value (' + p.unit + ')', input(st, 'value', { inputmode: 'decimal' }), { required: true, error: verr }),
            field('rp-reason', 'Reason / technical decision reference', area(st, 'reason', { rows: 2 }), { required: true, error: err })],
          foot: footButtons(api, 'Record decision', () => {
            verr = st.value.trim() ? null : 'Enter the chosen value.';
            const r = verr ? { ok: false, fields: {} } : EQ.api.resolveParameter(p.code, st.value, st.reason);
            if (r.ok) { api.close(r); EQ.toast('Decision recorded for ' + p.label, PROTO_NOTE); } else { err = r.fields && r.fields.reason; api.render(); }
          }),
        };
      },
    });
  };
  EQ._dlg = { field, input, area, select, radios, errorSummary, openDialog, footButtons, writerGuard, confirmDialog };
})(window.EQ);
