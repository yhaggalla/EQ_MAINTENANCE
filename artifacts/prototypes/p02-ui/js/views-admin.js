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
          h('th', { scope: 'row' }, h('a', { href: '#/equipment/' + e.id }, e.code)), h('td', null, e.typeCode),
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

  function catalogSection() {
    const subs = EQ.catalog.subs;
    const q = ui.catQ.toLowerCase();
    const search = h('input', { type: 'search', id: 'cq', 'data-fk': 'cq', value: ui.catQ, placeholder: 'Code, name or description', autocomplete: 'off', onInput: (e) => { ui.catQ = e.target.value; EQ.rerender(); } });
    const blocks = EQ.catalog.mains.map((m) => {
      const list = subs.filter((s) => s.main === m.code && (!q || (s.code + ' ' + s.name + ' ' + s.sourceName + ' ' + s.description + ' ' + m.name).toLowerCase().includes(q)));
      if (!list.length && q) return null;
      return h('section', { class: 'panel', 'aria-labelledby': 'cm-' + m.code },
        h('header', { class: 'col' }, h('div', { class: 'row between', style: 'padding:.55rem .75rem;border-bottom:1px solid var(--border)' }, h('h3', { id: 'cm-' + m.code }, m.code + ' ' + m.name), h('span', { class: 'tag' }, list.length + ' sub'))),
        h('div', { class: 'table-wrap' }, h('table', null, h('thead', null, h('tr', null, ['Code', 'Name', 'Original label', 'Description', 'State', 'Action'].map((c) => h('th', { scope: 'col' }, c)))),
          h('tbody', null, list.map((s) => h('tr', { class: s.active ? '' : 'inactive' },
            h('td', { class: 'mono' }, s.code), h('td', null, s.name || 'Reserved'), h('td', { class: 'small' }, s.sourceName === s.name ? 'Same' : s.sourceName ? '"' + s.sourceName + '"' : '(blank in source)'),
            h('td', { class: 'small', style: 'max-width:36rem' }, s.description || 'No description in the source'),
            h('td', null, s.active ? h('span', { class: 'tag green' }, 'Active') : h('span', { class: 'tag' }, s.reserved ? 'Reserved, inactive' : 'Inactive')),
            h('td', null, s.reserved ? h('span', { class: 'small muted' }, 'Define before use') : h('button', { type: 'button', class: 'btn-sm', onClick: () => { const r = EQ.api.setCatalogActive(s.code, !s.active); EQ.toast(r.ok ? s.code + (s.active ? ' activated' : ' deactivated (history stays readable)') : r.message, 'Prototype: in memory only.'); } }, s.active ? 'Deactivate' : 'Activate'))))))));
    });
    const active = subs.filter((s) => s.active).length;
    return h('div', { class: 'stack' },
      h('h2', null, 'Mechanism catalogue'),
      h('div', { class: 'row' }, h('span', { class: 'tag' }, '16 main'), h('span', { class: 'tag' }, '43 sub'), h('span', { class: 'tag green' }, active + ' active'), h('span', { class: 'tag' }, (43 - active) + ' reserved inactive (048, 063)'), h('span', { class: 'tag dashed' }, 'Main 10 intentionally absent')),
      h('div', { class: 'notice info' }, icon('info'), h('p', null, 'Real reference data from the approved catalogue. Codes are strings with their leading zeros. 061 is Spreader and 062 is Headblock; the original labels stay visible. 015, 024 and 033 are three separate steel-rope definitions. Used definitions are deactivated, never deleted.')),
      h('div', { class: 'field', style: 'max-width:28rem' }, h('label', { for: 'cq' }, 'Search the catalogue'), search),
      blocks.filter(Boolean).length ? blocks : h('div', { class: 'panel empty' }, 'No definition matches.'));
  }

  function positionsSection(q) {
    const S = EQ.state;
    const cands = S.D.equipment.filter((e) => e.mains.length);
    const cur = EQ.eq(q.equipment) && EQ.eq(q.equipment).mains.length ? EQ.eq(q.equipment) : cands[0];
    const sel = h('select', { id: 'ps-eq', onChange: (e) => EQ.nav('/admin/positions', { equipment: e.target.value }) }, cands.map((e) => h('option', { value: e.id, selected: e.id === cur.id ? true : null }, e.code + (e.positionState === 'draft' ? ' (drafts)' : ''))));
    const ps = EQ.positionsOf(cur.id);
    const drafts = ps.filter((p) => p.state === 'draft');
    const hasHist = (p) => S.D.events.some((e) => e.positionId === p.id) || S.D.jobs.some((j) => j.positionId === p.id);
    const checks = new Set([...ui.sel].filter((id) => drafts.some((d) => d.id === id)));
    const box = h('div', { class: 'stack' },
      h('div', { class: 'row between' }, h('h2', null, 'Main-part positions'), h('div', { class: 'field', style: 'min-width:14rem' }, h('label', { for: 'ps-eq' }, 'Equipment'), sel)),
      h('div', { class: 'notice info' }, icon('info'), h('p', null, 'These positions are a SYNTHETIC EXAMPLE of the template that P03/P06 derive from the as-built drawings (B-08). Admin reviews, edits and confirms them before any history is recorded. Structural members sit under 15/151 (frame, legs, girders, mast) and 03/031 (boom) by default. Once confirmed, the semantic key never changes.')),
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
          h('td', { class: 'small' }, p.prov === 'n/a' ? 'Synthetic' : p.prov, ' · ', p.src),
          h('td', null, p.state === 'active' ? h('button', { type: 'button', class: 'btn-sm', onClick: () => { const r = EQ.api.setPositionState(p.id, 'deactivated'); EQ.toast(hasHist(p) ? 'Deactivated: new work refused, history stays readable' : 'Deactivated', 'Prototype: in memory only.'); } }, 'Deactivate') : p.state === 'deactivated' ? h('span', { class: 'small muted' }, 'Deactivated') : null)); })))),
      identityCheck());
    return box;
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
    return h('div', { class: 'stack' },
      h('h2', null, 'Source specifications'),
      h('div', { class: 'notice info' }, icon('info'), h('p', null, 'Real drawing observations for the CICT-J526A-STS family (J526A00 general arrangement and linked sheets). They are not an approved assignment to any real crane. A decision never overwrites the observations; it records the chosen value with a reason for the model scope.')),
      h('div', { class: 'panel table-wrap' }, h('table', null, h('caption', { class: 'sr-only' }, 'Source parameters'),
        h('thead', null, h('tr', null, ['Parameter', 'Observations', 'Condition', 'Use', 'State', 'Action'].map((c) => h('th', { scope: 'col' }, c)))),
        h('tbody', null, EQ.sourceParams.map((p) => {
          const conflict = new Set(p.observations.map((o) => o.value)).size > 1; const res = S.D.resolved && S.D.resolved[p.code];
          return h('tr', null, h('th', { scope: 'row' }, p.label + (p.motorCount ? ' (x' + p.motorCount + ')' : '')),
            h('td', null, p.observations.map((o) => h('div', null, (p.operator ? p.operator + ' ' : '') + o.value + (p.unit ? ' ' + p.unit : '') + ' ', h('span', { class: 'small muted' }, o.drawing + ' p' + o.page + (o.supplementary ? ' (suppl.)' : ''))))),
            h('td', { class: 'small' }, p.condition || ''), h('td', null, p.use), h('td', null, conflict && !res ? h('span', { class: 'tag red' }, 'Unresolved conflict') : res ? h('span', { class: 'tag green' }, 'Resolved: ' + res.value + ' ' + p.unit) : h('span', { class: 'tag' }, 'Read from drawing')),
            h('td', null, conflict ? h('button', { type: 'button', class: 'btn-sm', onClick: () => EQ.dlg.resolveParam(p) }, res ? 'Revise decision' : 'Resolve...') : null)); })))));
  }

  function bindingsSection(q) {
    const S = EQ.state;
    const cands = S.D.equipment.filter((e) => e.typeCode === 'QC');
    const cur = EQ.eq(q.equipment) && EQ.eq(q.equipment).typeCode === 'QC' ? EQ.eq(q.equipment) : cands[0];
    const sel = h('select', { id: 'bd-eq', onChange: (e) => EQ.nav('/admin/bindings', { equipment: e.target.value }) }, cands.map((e) => h('option', { value: e.id, selected: e.id === cur.id ? true : null }, e.code)));
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

  EQ.views.admin = function admin(section, q) {
    const page = h('div', { class: 'page' });
    page.appendChild(h('div', { class: 'page-head' }, h('div', null, h('p', { class: 'eyebrow' }, 'EQ Maintenance Admin'), h('h1', null, 'Administration'), h('p', null, 'Equipment, templates, catalogue, positions and specifications. Central identities and Portal roles are managed in the Portal, not here.'))));
    if (!EQ.perm.admin()) {
      page.appendChild(h('div', { class: 'notice error', role: 'alert' }, icon('lock'), h('div', null, h('p', null, h('strong', null, '403 - EQ Maintenance Admin only. '), 'The server refuses every Admin endpoint for your role. The Admin tab is hidden for you, but hiding it is not the control: a direct link or API call is denied.'), h('p', { class: 'small', style: 'margin-top:.3rem' }, 'Prototype: switch the role to Admin in Prototype controls to see these screens.'))));
      return page;
    }
    const s = SECTIONS.find((x) => x[0] === section) ? section : 'equipment';
    const content = { equipment: equipmentSection, models: modelsSection, catalog: catalogSection, positions: () => positionsSection(q), parameters: parametersSection, bindings: () => bindingsSection(q) }[s]();
    page.appendChild(h('div', { class: 'admin-layout' },
      h('nav', { class: 'panel subnav', 'aria-label': 'Admin sections' }, SECTIONS.map(([k, label, ic]) => h('a', { href: '#/admin/' + k, 'aria-current': k === s ? 'page' : null, 'data-fk': 'an-' + k }, icon(ic), label))),
      h('div', { class: 'stack', style: 'min-width:0' }, content)));
    return page;
  };
})(window.EQ);
