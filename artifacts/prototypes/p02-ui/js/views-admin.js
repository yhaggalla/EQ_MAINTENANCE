/* Admin workspace (EQ Maintenance Admin only): equipment, models and applicability, catalogue, main-part positions,
   source specifications and scene-binding validation. Central identity administration belongs to the Portal and is absent. */
window.EQ = window.EQ || {};
(function (EQ) {
  const h = EQ.h, icon = EQ.icon;
  EQ.views = EQ.views || {};
  const ui = (EQ.adminUI = { catQ: '', sel: new Set() });
  const SECTIONS = [['equipment', 'Equipment', 'list'], ['models', 'Models and applicability', 'cube'], ['catalog', 'Mechanism catalogue', 'tree'], ['positions', 'Main-part positions', 'wrench'], ['parameters', 'Specifications', 'file'], ['bindings', 'Model bindings', 'gear']];
  const APPL = { applicable: 'Applicable', notApplicable: 'Not applicable', unknown: 'Unknown' };

  function equipmentSection() {
    const S = EQ.state;
    return h('div', { class: 'stack' },
      h('div', { class: 'row between' }, h('h2', null, 'Equipment register'), h('button', { type: 'button', class: 'primary', onClick: () => EQ.dlg.newEquipment() }, icon('plus'), 'Register equipment')),
      h('div', { class: 'notice info' }, icon('info'), h('p', null, 'The J526A template is never assigned automatically. An Admin verifies each equipment-to-model association with a note (SRC06). New equipment is Unreported with no serial or commissioning date.')),
      h('div', { class: 'panel table-wrap' }, h('table', null,
        h('caption', { class: 'sr-only' }, 'Equipment register'),
        h('thead', null, h('tr', null, ['Code', 'Type', 'Model association', 'Status', 'Lifecycle', 'Open jobs', 'Actions'].map((c) => h('th', { scope: 'col' }, c)))),
        h('tbody', null, S.D.equipment.map((e) => h('tr', { class: e.lifecycle === 'retired' ? 'inactive' : '' },
          h('th', { scope: 'row' }, h('a', { href: '#/eq/equipment/' + e.id }, e.code)), h('td', null, e.typeCode),
          h('td', null, EQ.verified(e) ? h('span', null, e.modelCode, ' ', h('span', { class: 'tag green' }, 'verified')) : h('span', { class: 'tag dashed' }, 'No verified model')),
          h('td', null, EQ.statusBadge(e.status)), h('td', null, e.lifecycle), h('td', null, String(EQ.openJobs(e.id).length)),
          h('td', null, h('div', { class: 'row' },
            !EQ.verified(e) && e.lifecycle === 'active' ? h('button', { type: 'button', class: 'btn-sm', onClick: () => assoc(e) }, 'Associate model...') : null,
            e.lifecycle === 'active' ? h('button', { type: 'button', class: 'btn-sm danger-btn', onClick: () => { const r = EQ.api.retireEquipment(e.id); EQ.toast(r.ok ? e.code + ' retired' : 'Refused: ' + r.message, 'Prototype: in memory only.'); } }, 'Retire') : null)))))))
    );
  }
  function assoc(e) {
    const models = EQ.state.D.models.filter((m) => m.typeCode === e.typeCode);
    EQ.dlg.reason({ title: 'Verify model association - ' + e.code, message: 'Available ' + e.typeCode + ' models: ' + models.map((m) => m.code).join(', ') + '. Verified association instantiates the template as DRAFT positions for Admin review; nothing becomes active automatically.', label: 'Verification note (who confirmed, from what source)', confirm: 'Verify and create draft positions', onSubmit: (note) => EQ.api.associateModel(e.id, models[0] && models[0].code, note) });
  }

  let modelSel = 'CICT-J526A-STS';
  function modelsSection() {
    const S = EQ.state;
    const m = EQ.model(modelSel) || S.D.models[0];
    const using = S.D.equipment.filter((e) => e.modelCode === m.code).length;
    const sel = h('select', { id: 'md-sel', onChange: (e) => { modelSel = e.target.value; EQ.rerender(); } }, S.D.models.map((x) => h('option', { value: x.code, selected: x.code === m.code ? true : null }, x.code)));
    const rows = [];
    EQ.catalog.mains.forEach((mm) => {
      rows.push(h('tr', { class: 'inactive' }, h('th', { scope: 'row', colspan: 4 }, mm.code + ' ' + mm.name)));
      EQ.catalog.subs.filter((s) => s.main === mm.code).forEach((s) => {
        const st = m.applic[s.code] || 'unknown';
        const dis = !s.active;
        const ctl = h('select', { 'aria-label': 'Applicability of ' + s.code + ' ' + (s.name || 'reserved') + ' for ' + m.code, disabled: dis ? true : null, 'data-fk': 'ap-' + s.code, onChange: (e) => { const r = EQ.api.setApplicability(m.code, s.code, e.target.value); if (!r.ok) EQ.toast(r.message); } },
          Object.entries(APPL).map(([v, l]) => h('option', { value: v, selected: st === v ? true : null }, l)));
        rows.push(h('tr', { class: dis ? 'inactive' : '' }, h('td', { class: 'mono' }, s.code), h('td', null, s.name || 'Reserved, no name', dis ? h('span', { class: 'tag', style: 'margin-left:.4rem' }, 'Inactive, not selectable') : null), h('td', null, ctl), h('td', { class: 'small muted' }, st === 'unknown' ? 'Unknown is never treated as applicable' : '')));
      });
    });
    return h('div', { class: 'stack' },
      h('div', { class: 'row between' }, h('h2', null, 'Models and applicability'), h('div', { class: 'field', style: 'min-width:14rem' }, h('label', { for: 'md-sel' }, 'Model template'), sel)),
      h('div', { class: 'notice info' }, icon('info'), h('p', null, h('strong', null, m.name + ' - template revision ' + m.templateRevision + ', used by ' + using + ' equipment item(s). '), 'Applicability belongs to the model. Editing it only raises the template revision; it never changes installed positions, jobs or history. Applying a newer revision to equipment is a separate, previewed Admin action.', h('br'), m.code === 'CICT-J526A-STS' ? 'Initial states are candidates from the source review (docs/SOURCE_MAP.md s6), not confirmed facts: for example 043, 044, 045 and 091-094 are tentatively not applicable to this electric rail-mounted family, and 047, 154, 155 and 064 stay Unknown.' : 'Synthetic illustrative applicability for prototype review.')),
      h('div', { class: 'panel table-wrap matrix' }, h('table', null, h('caption', { class: 'sr-only' }, 'Applicability matrix'), h('thead', null, h('tr', null, ['Code', 'Definition', 'Applicability', 'Note'].map((c) => h('th', { scope: 'col' }, c)))), h('tbody', null, rows))));
  }

  // ---------------------------------------------------------------- U1-C22: one small form dialog for the Admin add/adjust actions
  const K = () => EQ._dlg;
  const ADMIN_NOTE = 'Prototype: in memory only; the change is audited and the previous values are kept.';
  /** spec = { title, intro, init, fields(st, errors, api) -> nodes, submit, onSubmit(st) -> result, done(st, result) -> toast text } */
  function adminForm(spec) {
    const st = { ...(spec.init || {}) }; let errors = {}, message = null;
    return K().openDialog({ build(api) {
      return {
        title: spec.title,
        body: [message ? h('div', { class: 'notice error', role: 'alert', 'data-fk-note': 'refusal' }, icon('alert'), h('p', null, message)) : null,
          spec.intro ? h('div', { class: 'notice info' }, icon('info'), h('p', null, spec.intro)) : null,
          ...spec.fields(st, errors, api)],
        foot: K().footButtons(api, spec.submit, () => {
          const r = spec.onSubmit(st);
          if (r.ok) { api.close(r); EQ.toast(spec.done(st, r), ADMIN_NOTE); }
          else { errors = r.fields || {}; message = r.code === 'validation_failed' ? null : r.message + ' (' + r.status + ' ' + r.code + ')'; api.render(); }
        }),
      };
    } });
  }
  const fmtLogVal = (v) => (v == null ? 'nothing' : Object.entries(v).map(([k, x]) => k + ': ' + (x == null || x === '' ? '-' : x)).join(', '));
  const logList = (title, rows, label) => (rows.length ? h('section', { class: 'panel panel-pad stack', 'aria-label': title },
    h('h3', null, title + ' ', h('span', { class: 'tag' }, String(rows.length))),
    h('ul', { class: 'tl' }, rows.slice(0, 30).map((x) => h('li', { class: 'status' }, h('div', { class: 'row between' }, h('strong', null, label(x)), h('span', { class: 'when' }, EQ.fmtInstantShort(x.at) + ' by ' + EQ.userName(x.by))),
      x.before ? h('span', { class: 'small' }, 'Before: ', h('s', null, fmtLogVal(x.before))) : null, x.after ? h('span', { class: 'small' }, 'After: ', h('strong', null, fmtLogVal(x.after))) : null, x.reason ? h('span', { class: 'when' }, 'Reason: ' + x.reason) : null)))) : null);
  const originTag = (d) => (d.origin === 'admin' ? h('span', { class: 'tag gold', style: 'margin-left:.35rem' }, 'Added by Admin') : d.nameDecision === 'admin_renamed' ? h('span', { class: 'tag dashed', style: 'margin-left:.35rem' }, 'Renamed by Admin') : null);
  const nextFree = (from, to, taken) => { for (let i = from; i <= to; i += 1) { const c = String(i).padStart(to > 99 ? 3 : 2, '0'); if (!taken(c)) return c; } return ''; };

  function defDialog(code) {
    const d = EQ.mainDef(code) && !EQ.subDef(code) ? EQ.mainDef(code) : EQ.subDef(code);
    const locked = EQ.catalogLockedName(code);
    return adminForm({
      title: 'Edit ' + code + ' ' + (d.name || ''),
      intro: 'The code ' + code + (d.main ? ' and its main ' + d.main : '') + ' never change. ' + (locked ? code + ' ' + locked + ' is a user-confirmed name and stays; the description can be edited. ' : 'Renaming keeps the original label visible. ') + 'Every edit is audited and the previous values are kept.',
      init: { name: d.name || '', description: d.description || '', reason: '' },
      fields: (st, errors) => [
        locked ? h('div', { class: 'field' }, h('span', { class: 'label' }, 'Name'), h('div', null, icon('lock'), ' ' + locked + ' (fixed)')) : K().field('cd-name', 'Name', K().input(st, 'name', { maxlength: 200 }), { required: true, error: errors.name }),
        K().field('cd-desc', 'Description', K().area(st, 'description', { rows: 3, maxlength: 2000 }), { error: errors.description }),
        K().field('cd-reason', 'Reason (optional)', K().input(st, 'reason', { maxlength: 300 }), {})],
      submit: 'Save changes',
      onSubmit: (st) => EQ.api.editDef(code, { name: locked || st.name, description: st.description, reason: st.reason }),
      done: () => code + ' updated',
    });
  }
  function addMainDialog() {
    const taken = (c) => c === '10' || !!EQ.mainDef(c);
    return adminForm({
      title: 'Add main mechanism',
      intro: 'A new main mechanism gets a new two-digit code chosen by Admin. Approved codes are never reused or renumbered and main 10 stays absent. New definitions are not installed anywhere: an equipment gets them only through its model applicability and template.',
      init: { code: nextFree(18, 99, taken), name: '', description: '', reason: '' },
      fields: (st, errors) => [
        h('div', { class: 'grid-2' }, K().field('am-code', 'Code', K().input(st, 'code', { maxlength: 2, inputmode: 'numeric', style: 'max-width:7rem' }), { required: true, error: errors.code, hint: 'Two digits as text. Next free code: ' + nextFree(18, 99, taken) + '.' }),
          K().field('am-name', 'Name', K().input(st, 'name', { maxlength: 200 }), { required: true, error: errors.name })),
        K().field('am-desc', 'Description', K().area(st, 'description', { rows: 2, maxlength: 2000 }), { error: errors.description }),
        K().field('am-reason', 'Reason (optional)', K().input(st, 'reason', { maxlength: 300 }), {})],
      submit: 'Add main mechanism',
      onSubmit: (st) => EQ.api.addMainDef(st),
      done: (st) => 'Main ' + st.code.trim() + ' ' + st.name.trim() + ' added',
    });
  }
  function addSubDialog(mainCode) {
    const free = (m) => (m ? nextFree(Number(m + '1'), Number(m + '9'), (c) => !!EQ.subDef(c)) : '');
    return adminForm({
      title: 'Add submechanism',
      intro: 'A submechanism code is its main code plus one digit and is unique in the whole catalogue. Its parent never changes afterwards. 048 and 063 stay reserved.',
      init: { main: mainCode || '', code: free(mainCode), name: '', description: '', reason: '' },
      fields: (st, errors, api) => [
        h('div', { class: 'grid-2' },
          K().field('as2-main', 'Main mechanism', K().select(st, 'main', EQ.catalog.mains.filter((m) => m.active !== false).map((m) => ({ value: m.code, label: m.code + '  ' + m.name })), () => { st.code = free(st.main); api.render(); }, 'Choose the main mechanism'), { required: true, error: errors.main }),
          K().field('as2-code', 'Code', K().input(st, 'code', { maxlength: 3, inputmode: 'numeric', style: 'max-width:7rem' }), { required: true, error: errors.code, hint: st.main ? 'Next free code under ' + st.main + ': ' + (free(st.main) || 'none left') + '.' : 'Choose the main mechanism first.' })),
        K().field('as2-name', 'Name', K().input(st, 'name', { maxlength: 200 }), { required: true, error: errors.name }),
        K().field('as2-desc', 'Description', K().area(st, 'description', { rows: 2, maxlength: 2000 }), { error: errors.description }),
        K().field('as2-reason', 'Reason (optional)', K().input(st, 'reason', { maxlength: 300 }), {})],
      submit: 'Add submechanism',
      onSubmit: (st) => EQ.api.addSubDef(st),
      done: (st) => 'Submechanism ' + st.code.trim() + ' ' + st.name.trim() + ' added under ' + st.main,
    });
  }
  EQ.adminDlg = { defDialog, addMainDialog, addSubDialog };

  function catalogSection() {
    const subs = EQ.catalog.subs;
    const q = ui.catQ.toLowerCase();
    const search = h('input', { type: 'search', id: 'cq', 'data-fk': 'cq', value: ui.catQ, placeholder: 'Code, name or description', autocomplete: 'off', onInput: (e) => { ui.catQ = e.target.value; EQ.rerender(); } });
    const toggle = (d) => h('button', { type: 'button', class: 'btn-sm', 'data-fk': 'cat-act-' + d.code, onClick: () => { const r = EQ.api.setCatalogActive(d.code, !d.active); EQ.toast(r.ok ? d.code + (d.active ? ' activated' : ' deactivated (history stays readable)') : r.message, 'Prototype: in memory only.'); } }, d.active === false ? 'Activate' : 'Deactivate');
    const edit = (d) => h('button', { type: 'button', class: 'btn-sm', 'data-fk': 'cat-edit-' + d.code, 'aria-label': 'Edit ' + d.code + ' ' + (d.name || ''), onClick: () => defDialog(d.code) }, icon('edit'), 'Edit');
    const blocks = EQ.catalog.mains.map((m) => {
      const list = subs.filter((s) => s.main === m.code && (!q || (s.code + ' ' + s.name + ' ' + s.sourceName + ' ' + s.description + ' ' + m.name).toLowerCase().includes(q)));
      if (!list.length && q && !(m.code + ' ' + m.name).toLowerCase().includes(q)) return null;
      return h('section', { class: 'panel', 'aria-labelledby': 'cm-' + m.code, 'data-main': m.code },
        h('header', { class: 'col' }, h('div', { class: 'row between', style: 'padding:.55rem .75rem;border-bottom:1px solid var(--border)' },
          h('div', null, h('h3', { id: 'cm-' + m.code, style: 'display:inline' }, m.code + ' ' + m.name), originTag(m), m.active === false ? h('span', { class: 'tag', style: 'margin-left:.35rem' }, 'Inactive') : null, m.description ? h('div', { class: 'small muted' }, m.description) : null),
          h('div', { class: 'row' }, h('span', { class: 'tag' }, list.length + ' sub'), edit(m), toggle(m),
            m.active !== false ? h('button', { type: 'button', class: 'btn-sm', 'data-fk': 'cat-addsub-' + m.code, onClick: () => addSubDialog(m.code) }, icon('plus'), 'Add sub')  : null))),
        list.length ? h('div', { class: 'table-wrap' }, h('table', null, h('thead', null, h('tr', null, ['Code', 'Name', 'Original label', 'Description', 'State', 'Action'].map((c) => h('th', { scope: 'col' }, c)))),
          h('tbody', null, list.map((s) => h('tr', { class: s.active ? '' : 'inactive', 'data-code': s.code },
            h('td', { class: 'mono' }, s.code), h('td', null, s.name || 'Reserved', EQ.catalogLockedName(s.code) ? h('span', { class: 'lock', title: 'User-confirmed name (fixed)', 'aria-label': ' (user-confirmed name, fixed)' }, ' ', icon('lock')) : null, originTag(s)),
            h('td', { class: 'small' }, s.origin === 'admin' ? '(added by Admin)' : s.sourceName === s.name ? 'Same' : s.sourceName ? '"' + s.sourceName + '"' : '(blank in source)'),
            h('td', { class: 'small', style: 'max-width:36rem' }, s.description || 'No description in the source'),
            h('td', null, s.active ? h('span', { class: 'tag green' }, 'Active') : h('span', { class: 'tag' }, s.reserved ? 'Reserved, inactive' : 'Inactive')),
            h('td', null, s.reserved ? h('span', { class: 'small muted' }, 'Define before use') : h('div', { class: 'row' }, edit(s), toggle(s)))))))) : h('p', { class: 'small muted', style: 'margin:.5rem .75rem' }, 'No submechanisms yet.'));
    });
    const approvedSubs = subs.filter((s) => s.origin !== 'admin'); const approvedMains = EQ.catalog.mains.filter((m) => m.origin !== 'admin');
    const added = subs.length - approvedSubs.length + EQ.catalog.mains.length - approvedMains.length;
    const active = approvedSubs.filter((s) => s.active).length;
    return h('div', { class: 'stack' },
      h('div', { class: 'row between' }, h('h2', null, 'Mechanism catalogue'), h('div', { class: 'row' },
        h('button', { type: 'button', class: 'primary', 'data-fk': 'cat-add-main', onClick: () => addMainDialog() }, icon('plus'), 'Add main mechanism'),
        h('button', { type: 'button', 'data-fk': 'cat-add-sub', onClick: () => addSubDialog('') }, icon('plus'), 'Add submechanism'))),
      h('div', { class: 'row' }, h('span', { class: 'tag' }, approvedMains.length + ' main'), h('span', { class: 'tag' }, approvedSubs.length + ' sub'), h('span', { class: 'tag green' }, active + ' active'), h('span', { class: 'tag' }, approvedSubs.filter((s) => s.reserved).length + ' reserved inactive (048, 063)'), h('span', { class: 'tag dashed' }, 'Main 10 intentionally absent'), added ? h('span', { class: 'tag gold', 'data-fk': 'cat-added' }, added + ' added by Admin') : null),
      h('div', { class: 'notice info' }, icon('info'), h('p', null, 'Real reference data from the approved catalogue (16 main, 43 sub as delivered). Codes are strings with their leading zeros. 061 is Spreader and 062 is Headblock (user-confirmed names, fixed); the original labels stay visible. 015, 024 and 033 are three separate steel-rope definitions. An Admin can add main and sub mechanisms with new codes and edit names and descriptions (U1-C22): codes and parents never change, approved codes are never renumbered, main 10 stays absent, 048 and 063 stay reserved, and definitions are deactivated, never deleted. Every change is audited.')),
      h('div', { class: 'field', style: 'max-width:28rem' }, h('label', { for: 'cq' }, 'Search the catalogue'), search),
      blocks.filter(Boolean).length ? blocks : h('div', { class: 'panel empty' }, 'No definition matches.'),
      logList('Catalogue changes', EQ.state.D.catalogLog || [], (x) => x.code + ' ' + x.action));
  }

  function positionsSection(q) {
    const S = EQ.state;
    const cands = S.D.equipment.filter((e) => e.mains.length);
    const cur = EQ.eq(q.equipment) && EQ.eq(q.equipment).mains.length ? EQ.eq(q.equipment) : cands[0];
    const sel = h('select', { id: 'ps-eq', onChange: (e) => EQ.nav('/admin/eq/positions', { equipment: e.target.value }) }, cands.map((e) => h('option', { value: e.id, selected: e.id === cur.id ? true : null }, e.code + (e.positionState === 'draft' ? ' (drafts)' : ''))));
    const ps = EQ.positionsOf(cur.id);
    const drafts = ps.filter((p) => p.state === 'draft');
    const hasHist = (p) => S.D.events.some((e) => e.positionId === p.id) || S.D.jobs.some((j) => j.positionId === p.id);
    const checks = new Set([...ui.sel].filter((id) => drafts.some((d) => d.id === id)));
    const box = h('div', { class: 'stack' },
      h('div', { class: 'row between' }, h('h2', null, 'Main-part positions'), h('div', { class: 'row', style: 'align-items:flex-end' }, h('div', { class: 'field', style: 'min-width:14rem' }, h('label', { for: 'ps-eq' }, 'Equipment'), sel),
        cur.lifecycle === 'active' ? h('button', { type: 'button', class: 'primary', 'data-fk': 'pos-add', onClick: () => positionDialog(cur, null) }, icon('plus'), 'Add position') : null)),
      h('div', { class: 'notice info' }, icon('info'), h('p', null, 'These positions are a SYNTHETIC EXAMPLE of the template that P03/P06 derive from the as-built drawings (B-08). Admin reviews, edits and confirms them before any history is recorded. Structural members sit under 15/151 (frame, legs, girders, mast) and 03/031 (boom) by default. An Admin can add positions to one equipment (they start as drafts) and edit them (U1-C22): name and source always; semantic key and mechanism only while draft; kind and unit only before any history. Once confirmed, the semantic key never changes: a wrong key is fixed by deactivating the position and adding a new one.')),
      drafts.length ? h('div', { class: 'notice warn' }, icon('alert'), h('div', null, h('p', null, h('strong', null, drafts.length + ' draft position(s) await confirmation. '), 'No job can target a draft position and the scene cannot bind it.'), h('div', { class: 'actions' },
        h('button', { type: 'button', class: 'btn-sm primary', onClick: () => { const r = EQ.api.confirmPositions(cur.id, drafts.map((d) => d.id)); EQ.toast(r.ok ? 'Confirmed all drafts' : r.message, 'Prototype: in memory only.'); } }, 'Confirm all drafts'),
        h('button', { type: 'button', class: 'btn-sm', onClick: () => { const ids = [...ui.sel].filter((id) => drafts.some((d) => d.id === id)); const r = EQ.api.confirmPositions(cur.id, ids); ui.sel.clear(); EQ.toast(ids.length ? 'Confirmed ' + ids.length : 'Tick positions first', 'Prototype: in memory only.'); } }, 'Confirm ticked')))) : null,
      h('div', { class: 'panel table-wrap' }, h('table', null, h('caption', { class: 'sr-only' }, 'Positions of ' + cur.code),
        h('thead', null, h('tr', null, ['', 'Position', 'Semantic key', 'Mechanism', 'Kind / UOM', 'State', 'Provenance and source', 'Action'].map((c) => h('th', { scope: 'col' }, c)))),
        h('tbody', null, ps.map((p) => { const s = cur.subs.find((x) => x.id === p.subId); return h('tr', { class: p.state === 'deactivated' ? 'inactive' : '' },
          h('td', null, p.state === 'draft' ? h('input', { type: 'checkbox', 'aria-label': 'Select ' + p.name, 'data-fk': 'ck-' + p.id, checked: ui.sel.has(p.id) ? true : null, onChange: (e) => { if (e.target.checked) ui.sel.add(p.id); else ui.sel.delete(p.id); } }) : null),
          h('th', { scope: 'row' }, p.name, h('div', { class: 'small muted mono' }, p.id)),
          h('td', { class: 'mono' }, p.key, p.state !== 'draft' ? h('span', { class: 'lock', title: 'Key frozen once confirmed', 'aria-label': ' (frozen)' }, ' ', icon('lock')) : null),
          h('td', null, s.code + ' ' + EQ.defLabel(s.code)), h('td', null, p.kind === 'serialized' ? 'Serialized, ea' : 'Quantity lot, ' + p.uom),
          h('td', null, h('span', { class: 'tag ' + (p.state === 'active' ? 'green' : p.state === 'draft' ? 'dashed' : '') }, p.state)),
          h('td', { class: 'small' }, p.origin === 'admin' ? h('span', { class: 'tag gold' }, 'Added by Admin') : p.prov === 'n/a' ? 'Synthetic' : p.prov, ' · ', p.src),
          h('td', null, h('div', { class: 'row' },
            p.state !== 'deactivated' ? h('button', { type: 'button', class: 'btn-sm', 'data-fk': 'pos-edit-' + p.id, 'aria-label': 'Edit ' + p.name, onClick: () => positionDialog(cur, p) }, icon('edit'), 'Edit') : null,
            p.state === 'active' ? h('button', { type: 'button', class: 'btn-sm', onClick: () => { const r = EQ.api.setPositionState(p.id, 'deactivated'); EQ.toast(hasHist(p) ? 'Deactivated: new work refused, history stays readable' : 'Deactivated', 'Prototype: in memory only.'); } }, 'Deactivate') : p.state === 'deactivated' ? h('span', { class: 'small muted' }, 'Deactivated') : null))); })))),
      logList('Position changes on ' + cur.code, (S.D.positionLog || []).filter((x) => x.equipmentId === cur.id), (x) => (EQ.pos(x.posId) || {}).name + ' ' + x.action),
      identityCheck());
    return box;
  }
  /** Add (pos = null) or edit a main-part position of one equipment (U1-C22; API s4.13; DATA s3.4 P2/P3). */
  function positionDialog(eq, pos) {
    const draft = !pos || pos.state === 'draft'; const hist = pos ? EQ.posHasHistory(pos) : false;
    const subs = eq.subs.filter((s) => { const d = EQ.subDef(s.code); return d && d.active !== false && !d.reserved && (!s.state || s.state === 'active'); });
    const subLabel = (s) => s.code + '  ' + EQ.defLabel(s.code) + ' (main ' + (eq.mains.find((m) => m.id === s.mainId) || {}).code + ')';
    return adminForm({
      title: pos ? 'Edit position - ' + pos.name + ' (' + eq.code + ')' : 'Add position to ' + eq.code,
      intro: pos ? (draft ? 'Draft position: every field can still change. ' : 'Confirmed position: the semantic key and the mechanism are frozen. ') + (hist ? 'History exists here, so kind and unit are frozen too. ' : '') + 'Every edit is audited with the previous values.'
        : 'The new position starts as a DRAFT of ' + eq.code + ' only (another equipment from the same template is not changed). No job can target it and the scene cannot bind it until an Admin confirms it. Use the drawing reference as the source where one exists.',
      init: pos ? { name: pos.name, key: pos.key, subId: pos.subId, kind: pos.kind, uom: pos.kind === 'serialized' ? '' : pos.uom, source: pos.src } : { name: '', key: '', subId: '', kind: 'serialized', uom: '', source: '' },
      fields: (st, errors, api) => [
        K().field('pf-name', 'Position name', K().input(st, 'name', { maxlength: 200 }), { required: true, error: errors.name }),
        K().field('pf-sub', 'Mechanism (submechanism of ' + eq.code + ')', (() => { const el = K().select(st, 'subId', (draft ? subs : eq.subs.filter((s) => s.id === st.subId)).map((s) => ({ value: s.id, label: subLabel(s) })), null, 'Choose the submechanism'); if (!draft) el.disabled = true; return el; })(), { required: true, error: errors.subId, hint: draft ? 'Only active, non-reserved definitions of this equipment are offered.' : 'Frozen since confirmation.' }),
        K().field('pf-key', 'Binding key (semantic key)', (() => { const el = K().input(st, 'key', { maxlength: 128, autocomplete: 'off', spellcheck: 'false', class: 'mono' }); if (!draft) el.disabled = true; return el; })(), { required: true, error: errors.key, hint: draft ? 'Lowercase segments joined by dots, for example hoist.drive.motor.c. The scene binds the node with exactly this key.' : 'Frozen since confirmation (DATA s3.4 P2).' }),
        (() => { const r = K().radios(st, 'kind', 'pf-kind', [{ value: 'serialized', label: 'Serialized (1 ea)' }, { value: 'quantityLot', label: 'Quantity lot' }], () => api.render(), 'Kind *', errors.kind); if (hist) r.querySelectorAll('input').forEach((i) => { i.disabled = true; }); return r; })(),
        st.kind === 'quantityLot' ? K().field('pf-uom', 'Unit', (() => { const el = K().input(st, 'uom', { maxlength: 16, style: 'max-width:9rem' }); if (hist) el.disabled = true; return el; })(), { required: true, error: errors.uom, hint: 'For example rope, set, m or pcs.' }) : null,
        K().field('pf-src', 'Source reference', K().input(st, 'source', { maxlength: 300 }), { error: errors.source, hint: 'Drawing number and page, or another source.' })],
      submit: pos ? 'Save changes' : 'Add draft position',
      onSubmit: (st) => (pos ? EQ.api.editPosition(pos.id, st) : EQ.api.addPosition(eq.id, st)),
      done: (st) => (pos ? 'Position ' + st.name.trim() + ' updated' : 'Draft position ' + st.name.trim() + ' added to ' + eq.code + '; confirm it before use'),
    });
  }
  function identityCheck() {
    const a = EQ.eq('eq-qc-demo-01'), b = EQ.eq('eq-qc-demo-02');
    if (!a || !b) return null;
    const keys = ['hoist.drive.motor.a', 'trolley.wheel.position.a', 'hoist.rope.set.main'];
    const S = EQ.state;
    return h('section', { class: 'panel panel-pad stack', 'aria-labelledby': 'idc' }, h('h3', { id: 'idc' }, 'Identity check: one template, separate positions'),
      h('p', { class: 'small muted', style: 'margin:0' }, 'QC-DEMO-01 and QC-DEMO-02 share the J526A template, but each semantic key resolves to a different position ID with independent history.'),
      h('div', { class: 'table-wrap' }, h('table', null, h('thead', null, h('tr', null, ['Semantic key', a.code + ' position ID', 'Events', b.code + ' position ID', 'Events'].map((c) => h('th', { scope: 'col' }, c)))),
        h('tbody', null, keys.map((k) => { const pa = EQ.positionsOf(a.id).find((p) => p.key === k), pb = EQ.positionsOf(b.id).find((p) => p.key === k); const n = (p) => S.D.events.filter((e) => e.positionId === p.id).length; return h('tr', null, h('th', { scope: 'row', class: 'mono' }, k), h('td', { class: 'mono' }, pa.id), h('td', null, String(n(pa))), h('td', { class: 'mono' }, pb.id), h('td', null, String(n(pb)))); })))));
  }

  function parametersSection() {
    const S = EQ.state;
    const ph = S.D.paramHistory || {};
    const rows = EQ.allParams().flatMap((p) => {
      const conflict = new Set(p.observations.map((o) => o.value)).size > 1; const res = S.D.resolved && S.D.resolved[p.code];
      const admin = p.origin === 'admin'; const earlier = ph[p.code] || [];
      const unit = p.unit ? ' ' + p.unit : '';
      const out = [h('tr', { 'data-param': p.code },
        h('th', { scope: 'row' }, p.label + (p.motorCount ? ' (x' + p.motorCount + ')' : ''), admin ? h('div', null, h('span', { class: 'tag gold' }, 'Admin-entered')) : null),
        h('td', null, admin ? h('span', { class: 'small muted' }, 'No drawing observation') : p.observations.map((o) => h('div', null, (p.operator ? p.operator + ' ' : '') + o.value + unit + ' ', h('span', { class: 'small muted' }, o.drawing + ' p' + o.page + (o.supplementary ? ' (suppl.)' : ''))))),
        h('td', { class: 'small' }, p.condition || ''), h('td', null, p.use + (p.mainCode ? ' · main ' + p.mainCode : '')),
        h('td', null, conflict && !res ? h('span', { class: 'tag red' }, 'Unresolved conflict') : res ? h('span', { class: 'tag green' }, (res.basis === 'adminEntered' ? 'Admin value: ' : 'Resolved: ') + res.value + unit) : h('span', { class: 'tag' }, 'Read from drawing'),
          res && res.source ? h('div', { class: 'small muted' }, 'Source: ' + res.source) : null),
        h('td', null, h('div', { class: 'row' },
          conflict ? h('button', { type: 'button', class: 'btn-sm', onClick: () => EQ.dlg.resolveParam(p) }, res ? 'Revise decision' : 'Resolve...')
            : h('button', { type: 'button', class: 'btn-sm', 'data-fk': 'spec-val-' + p.code, onClick: () => valueDialog(p) }, admin ? 'New value...' : res ? 'Change value...' : 'Set value...'),
          admin ? h('button', { type: 'button', class: 'btn-sm', 'data-fk': 'spec-edit-' + p.code, onClick: () => specDialog(p) }, icon('edit'), 'Edit') : null)))];
      if (earlier.length) out.push(h('tr', { class: 'hist-row', 'data-param-hist': p.code }, h('td', { colspan: 6 }, h('details', null, h('summary', null, 'Earlier values and edits (' + earlier.length + ')'),
        h('ul', { class: 'tl' }, earlier.map((x) => h('li', { class: 'status' }, x.kind === 'value'
          ? h('span', { class: 'small' }, h('s', null, x.value + unit), ' recorded ' + EQ.fmtInstantShort(x.at) + ' by ' + EQ.userName(x.by) + (x.reason ? ' (' + x.reason + ')' : '') + (x.source ? ', source ' + x.source : '') + '; superseded ' + EQ.fmtInstantShort(x.supersededAt))
          : h('span', { class: 'small' }, 'Definition edited ' + EQ.fmtInstantShort(x.at) + ' by ' + EQ.userName(x.by) + ': ', h('s', null, fmtLogVal(x.before)), ' -> ', fmtLogVal(x.after)))))))));
      return out;
    });
    return h('div', { class: 'stack' },
      h('div', { class: 'row between' }, h('h2', null, 'Source specifications'), h('button', { type: 'button', class: 'primary', 'data-fk': 'spec-add', onClick: () => specDialog(null) }, icon('plus'), 'Add specification')),
      h('div', { class: 'notice info' }, icon('info'), h('p', null, 'Real drawing observations for the CICT-J526A-STS family (J526A00 general arrangement and linked sheets). They are not an approved assignment to any real crane. A decision never overwrites the observations; it records the chosen value with a reason for the model scope. An Admin can also add specification rows with value, unit and source, and record new values on any row (U1-C22): earlier values are kept, Admin-entered rows are labelled as such and drawing observations are never edited.')),
      h('div', { class: 'panel table-wrap' }, h('table', null, h('caption', { class: 'sr-only' }, 'Source parameters'),
        h('thead', null, h('tr', null, ['Parameter', 'Observations', 'Condition', 'Use', 'State', 'Action'].map((c) => h('th', { scope: 'col' }, c)))),
        h('tbody', null, rows))));
  }
  /** Record a new value for one parameter (model scope); the prior value is kept (API s4.13 POST /admin/parameters/values). */
  function valueDialog(p) {
    const res = EQ.state.D.resolved && EQ.state.D.resolved[p.code];
    return adminForm({
      title: (p.origin === 'admin' ? 'New value - ' : res ? 'Change value - ' : 'Set value - ') + p.label,
      intro: (p.observations.length ? 'Drawing observation: ' + p.observations.map((o) => o.value + (p.unit ? ' ' + p.unit : '') + ' (' + o.drawing + ' p' + o.page + ')').join('; ') + '. It stays visible beside the chosen value. ' : '') + (res ? 'Current value ' + res.value + (p.unit ? ' ' + p.unit : '') + ' is kept as an earlier value. ' : '') + 'The value applies to the CICT-J526A-STS model scope.',
      init: { value: '', source: '', reason: '' },
      fields: (st, errors) => [
        K().field('pv-value', 'Value' + (p.unit ? ' (' + p.unit + ')' : ''), K().input(st, 'value', { maxlength: 100 }), { required: true, error: errors.value }),
        K().field('pv-source', 'Source', K().input(st, 'source', { maxlength: 300 }), { error: errors.source, hint: 'Document and page, nameplate or decision reference.' }),
        K().field('pv-reason', 'Reason', K().area(st, 'reason', { rows: 2 }), { required: true, error: errors.reason })],
      submit: 'Record value',
      onSubmit: (st) => EQ.api.resolveParameter(p.code, st.value, st.reason, { source: st.source, basis: 'adminEntered' }),
      done: (st) => p.label + ' set to ' + st.value.trim() + (p.unit ? ' ' + p.unit : ''),
    });
  }
  /** Add an Admin-entered specification row (p = null) or edit its definition (label, unit, condition, use, main mechanism). */
  function specDialog(p) {
    const mains = EQ.catalog.mains.filter((m) => m.active !== false).map((m) => ({ value: m.code, label: m.code + '  ' + m.name }));
    return adminForm({
      title: p ? 'Edit specification - ' + p.label : 'Add specification',
      intro: p ? 'The value is changed with New value...; edits here keep the previous definition in the row history.' : 'Adds a specification row for the CICT-J526A-STS model scope. It is labelled Admin-entered wherever it appears (Technical tab included) and has no drawing observation. Link it to a main mechanism to show it in that mechanism\'s Technical tab; Major rows also show for the whole equipment.',
      init: p ? { label: p.label, unit: p.unit || '', condition: p.condition || '', use: p.use, mainCode: p.mainCode || '' } : { label: '', value: '', unit: '', condition: '', use: 'technical', mainCode: '', source: '', reason: '' },
      fields: (st, errors) => [
        K().field('sf-label', 'Specification', K().input(st, 'label', { maxlength: 120 }), { required: true, error: errors.label }),
        p ? null : h('div', { class: 'grid-2' }, K().field('sf-value', 'Value', K().input(st, 'value', { maxlength: 100 }), { required: true, error: errors.value }), K().field('sf-unit', 'Unit', K().input(st, 'unit', { maxlength: 16, style: 'max-width:9rem' }), { error: errors.unit })),
        p ? K().field('sf-unit', 'Unit', K().input(st, 'unit', { maxlength: 16, style: 'max-width:9rem' }), { error: errors.unit }) : null,
        K().field('sf-cond', 'Condition (optional)', K().input(st, 'condition', { maxlength: 200 }), {}),
        K().radios(st, 'use', 'sf-use', [{ value: 'major', label: 'Major' }, { value: 'technical', label: 'Technical' }], null, 'Use *', errors.use),
        K().field('sf-main', 'Main mechanism (optional)', K().select(st, 'mainCode', mains, null, 'Equipment level only'), { error: errors.mainCode }),
        p ? null : K().field('sf-source', 'Source', K().input(st, 'source', { maxlength: 300 }), { required: true, error: errors.source, hint: 'Document and page, nameplate or decision reference.' }),
        p ? null : K().field('sf-reason', 'Reason (optional)', K().input(st, 'reason', { maxlength: 300 }), {})],
      submit: p ? 'Save changes' : 'Add specification',
      onSubmit: (st) => (p ? EQ.api.editSpec(p.code, st) : EQ.api.addSpec(st)),
      done: (st) => 'Specification ' + st.label.trim() + (p ? ' updated' : ' added'),
    });
  }

  function bindingsSection(q) {
    const S = EQ.state;
    const cands = S.D.equipment.filter((e) => e.typeCode === 'QC');
    const cur = EQ.eq(q.equipment) && EQ.eq(q.equipment).typeCode === 'QC' ? EQ.eq(q.equipment) : cands[0];
    const sel = h('select', { id: 'bd-eq', onChange: (e) => EQ.nav('/admin/eq/scene-bindings', { equipment: e.target.value }) }, cands.map((e) => h('option', { value: e.id, selected: e.id === cur.id ? true : null }, e.code)));
    const keys = new Set(EQ.sceneKeys());
    const ps = EQ.positionsOf(cur.id).filter((p) => p.state === 'active');
    const exact = ps.filter((p) => keys.has(p.key)), noNode = ps.filter((p) => !keys.has(p.key));
    const orphan = [...keys].filter((k) => !ps.some((p) => p.key === k));
    const rule = (id, text, ok, note) => h('tr', null, h('td', { class: 'mono' }, id), h('td', null, text), h('td', null, h('span', { class: 'tag ' + (ok === true ? 'green' : ok === false ? 'red' : 'dashed') }, ok === true ? 'Pass' : ok === false ? 'Fail' : 'Not applicable')), h('td', { class: 'small' }, note || ''));
    const b1 = EQ.verified(cur) && cur.modelCode === 'CICT-J526A-STS';
    return h('div', { class: 'stack' },
      h('div', { class: 'row between' }, h('h2', null, 'Model binding validation'), h('div', { class: 'field', style: 'min-width:14rem' }, h('label', { for: 'bd-eq' }, 'Equipment'), sel)),
      h('div', { class: 'notice warn' }, icon('alert'), h('p', null, 'Prototype preview of the validation report. The scene here is the SVG placeholder keyed by the same semantic keys the P03 manifest will use; no model version is registered and nothing can be activated.')),
      h('div', { class: 'panel table-wrap' }, h('table', null, h('thead', null, h('tr', null, ['Rule', 'Check', 'Result', 'Detail'].map((c) => h('th', { scope: 'col' }, c)))), h('tbody', null,
        rule('B1', 'Verified association to the scene\'s equipment model', b1, b1 ? cur.modelCode : 'RTG/ES and equipment without a verified association cannot be bound'),
        rule('B2', 'Proposals only by exact node key = position semantic key', b1 ? true : null, b1 ? exact.length + ' exact-key matches; no name, order or index matching' : ''),
        rule('B3', 'Every active position is bound or explicitly "no visual"', b1 ? (noNode.length ? null : true) : null, b1 ? noNode.length + ' active position(s) have no scene node and need an explicit no-visual note: ' + (noNode.map((p) => p.key).join(', ') || 'none') : ''),
        rule('B6', 'Orphans against the previous binding', b1 ? true : null, b1 ? 'No previous binding in the prototype. Scene nodes without a position: ' + (orphan.join(', ') || 'none') : ''),
        rule('B7', 'Activation changes no position, installation, job or history row', true, 'History stays keyed to position IDs'),
        rule('B8', 'Two equipment items on one scene stay independent', true, 'Shared geometry never shares history')))),
      cur.positionState === 'draft' ? h('div', { class: 'notice warn' }, icon('alert'), h('p', null, cur.code + ' positions are still drafts: confirm them first (Main-part positions).')) : null);
  }

  // Section builders are exported; the Admin shell (EQ settings, FAC settings, Access) lives in views-admin2.js.
  EQ.adminEq = {
    list: SECTIONS.map(([k, label, ic]) => [k === 'bindings' ? 'scene-bindings' : k, label, ic]),
    build(section, q) {
      const key = section === 'scene-bindings' ? 'bindings' : section;
      return { equipment: equipmentSection, models: modelsSection, catalog: catalogSection, positions: () => positionsSection(q), parameters: parametersSection, bindings: () => bindingsSection(q) }[key]();
    },
  };
})(window.EQ);
