// ==UserScript==
// @name         FG Automation Suite
// @namespace    FG
// @version      3.1.0
// @description  Merged build — v3.0 engine (editable questionnaire, checklist status, status/category/discipline patching) + v3.0.1 question-text extraction and grid-search asset resolution.
// @match        https://burnsmcd.facilitygrid.net/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    /* ================================================================
     *  CONSTANTS & STATE
     * ================================================================ */
    let auditedAssetsData = [];
    let isMaximized = false;
    let docMetaCache = {};          // docId → { discipline, notes, name }
    let activeFilters = { type: 'All', category: 'All', discipline: 'All', status: 'All' };
    let checklistQuestionnaireData = new Map(); // checklistId → parsed questionnaire
    let questionnaireScanGeneration = 0;        // invalidates stale background loads

    const sleep = ms => new Promise(r => setTimeout(r, ms));

    const REQUIRED_DOCS = ['CB Torque','Power Torque','FTE','IR','Continuity','CVD'];

    const CHECKLIST_STATUSES = [
        'Draft','Incomplete','In Progress','Ready for Review',
        'Reviewed','Checked','Verified','Approved'
    ];

    const FG_CATEGORIES = [
        "Not Specified","Access Control","Acoustic Testing","Air Balancing Report",
        "Air Balancing Test Report","Air Quality Report","Approved Drawings",
        "Approved Sequence of Operations","Architectural","As-Builts",
        "Automation Operations","Balancing Report","Basis of Control","Basis of Design",
        "Battery Voltage Test Report","Benchmarks","Bill of Lading","Blank Test Forms",
        "Cable Test Report","Certificates","CFD Analysis","Checklist","Client Requirements",
        "Closeout Record","Closeout Submittals","Cold Test Report","Commissioning Plan",
        "Commissioning Report","Commissioning Schedule","Construction Documents",
        "Contact Resistance Test Report","Contract Drawings","Contract Modifications",
        "Contract Specifications","Contracts","Control Drawings","Coordination Documents",
        "Cx Method Statement","Cx Published Documents","Cx Resource","Cx Submittal Review",
        "Cx Test Reports","Data Logger Test Report","Datasheets","Design Data",
        "Design Review Comment","Detail Drawings","Deviation Forms",
        "DT Disposition Submittals","Duct Air Leakage Testing","Earthing Test Report",
        "Electrical High Voltage","Emergency Contact List","Emission Test Report","EOP",
        "Equipment Labels","Equipment Submittals","Factory Reports","Fire Alarm VI",
        "Fire Operations","Floorplans","Flushing Test Report",
        "Foreign Object Debris (FOD) Checklist","Fuel Balancing Test Report",
        "Fuel Quality Test Report","Full Packages","Functional Test",
        "GC/Vendor Test Reports","General","General Arrangements","HSE Operations",
        "HV Test Report","Inspection/Audit",
        "Insulation Resistance & Continuity Test Report","Integrated System Testing",
        "Integrity Test Report","Issues Logs","Layouts","Level 1 - Factory Tests",
        "Level 2 - QA-QC s","Level 3 - Site Acceptance",
        "Level 4 - Functional Performance Tests","Level 5 - Integrated Systems Tests",
        "Level 6 - Handover","Live Test Report","Loop Impedance Test Report",
        "M&E Contractor - Data Hall","Maintenance Contracts","Manufacturer Field Reports",
        "Manufacturer Instructions","Manufacturer Reports","Manufacturer Submittal Review",
        "Meeting Minutes","Method Statement","Model","MOP","Nameplate Data",
        "Non-Conformance Report","O&M Manual","Operating Procedures","Other",
        "Permit to Work","Phase Rotation Test Report","Photos","Piping",
        "Power Quality Test Report","Preliminary Design","Pressure Test Report",
        "Pressure Testing","Product Data","Punch List Items","Request for Information",
        "Re-testing Frequency","Samples","SCCS/Discrimination Study Report","Schedules",
        "Schedule of Maintenance","Sections & Elevations","Sensor Calibration and Actuators",
        "Sequence of Operations","Sequence of Operations and Control Drawings",
        "Shipping notifications","Shop Drawings","Shop Drawings Review",
        "Single Line Diagrams","Site Observation Report","SOP/MOP Combined",
        "Spare Parts Lists","Specifications","Startup Reports","Submittals",
        "System Single-Line Diagrams","Technical Literature","Templates","Test Reports",
        "Testing Adjusting Balancing Report","Thermography Test Report","Title 24",
        "Torque Test Report","Tracker","Training","Training Documents","Trend Reports",
        "Vacuum Test & Pressure Test Report","Warranties","Warranty",
        "Water Balancing Report","Sheet Metal","Water Balancing Test Report"
    ];

    const FG_DISCIPLINES = [
        "Not Specified","Multi-Discipline","Wood, Plastics, And Composites",
        "Building Enclosure","Openings","Finishes","Specialties","Equipment",
        "Special Construction","Conveying Equipment","Fire Suppression","Plumbing",
        "HVAC","Integrated Automation","Electrical","Communications",
        "Electronic Safety and Security","Earthwork","Exterior Improvements",
        "Utilities","Transportation","Project Engineer","Graphics","Tech",
        "Low Voltage","A/V Systems"
    ];

    const BRAND_GREEN  = '#2e7d32';
    const BRAND_LIGHT  = '#4CAF50';
    const BRAND_BORDER = '#1b5e20';
    const FG_DOC_XAUTH_KEY = 'fg_doc_x_auth_token_v1';
    const FG_LIVE_SCT_KEY  = 'ate_sct';

    /* ================================================================
     *  CORE HELPERS
     * ================================================================ */
    function getProjectId() {
        const p = new URLSearchParams(window.location.search);
        let id = p.get('prj') || p.get('PID');
        if (id && !isNaN(id)) return id;
        // Same-origin iframes often carry the prj param when the top URL doesn't
        for (const iframe of document.querySelectorAll('iframe')) {
            try {
                if (iframe.contentWindow && iframe.contentWindow.location) {
                    const fp = new URLSearchParams(iframe.contentWindow.location.search);
                    const fid = fp.get('prj') || fp.get('PID');
                    if (fid && !isNaN(fid)) return fid;
                }
            } catch (e) {}
        }
        const a = document.querySelector('a[href*="prj="], a[href*="PID="]');
        if (a) { const m = a.href.match(/(?:prj|PID)=(\d+)/); if (m) return m[1]; }
        return '992';
    }

    function getDocType(name) {
        name = (name || '').toLowerCase();
        if (name.includes('cb torque'))    return 'CB Torque';
        if (name.includes('power torque')) return 'Power Torque';
        if (name.includes('continuity'))   return 'Continuity';
        if (name.includes('fte'))          return 'FTE';
        if (name.includes('cvd'))          return 'CVD';
        if (/\bir\b/.test(name))           return 'IR';
        return 'Other';
    }

    function gridCellText(v) {
        const d = document.createElement('div');
        d.innerHTML = v == null ? '' : String(v);
        return (d.textContent || '').replace(/\s+/g, ' ').trim();
    }

    function escapeHtml(v) {
        return String(v == null ? '' : v).replace(/[&<>"']/g, ch => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[ch]));
    }

    const escapeAttr = escapeHtml;

    function getTargetContexts() {
        const ctxs = [document];
        document.querySelectorAll('iframe').forEach(f => {
            try { if (f.contentDocument) ctxs.push(f.contentDocument); } catch (e) {}
        });
        return ctxs;
    }

    function getChecklistMetadata(row) {
        const values = (row.cell || []).map(gridCellText).filter(Boolean);
        const rawCells = row.cell || [];
        const rawSubtask = gridCellText(row.cell?.[3])
            || values.find(v => /\bPFC-\d+\b/i.test(v));
        const subtask = rawSubtask
            ? rawSubtask.replace(/\b(PFC-)0*(\d+)\b/i, (_, p, d) => `${p}${d}`)
            : `Checklist ${row.id}`;
        const name = gridCellText(row.cell?.[7])
            || values.find(v => v !== rawSubtask && /^[A-Z0-9]+(?:_[A-Z0-9]+){2,}$/i.test(v))
            || values.find(v => v !== rawSubtask && v !== String(row.id))
            || 'Name unavailable';
        const status = gridCellText(row.cell?.[10]) || 'Unknown';
        const html = rawCells.map(v => String(v || '')).join(' ');
        const m = html.match(/href=["']([^"']*action=custac[^"']*)["']/i);
        return { id: row.id, subtask, name, status, statusUrl: m ? gridCellText(m[1]) : '' };
    }

    /* ================================================================
     *  TOKEN MANAGEMENT
     * ================================================================ */
    function getLiveToken() {
        try {
            return localStorage.getItem(FG_LIVE_SCT_KEY)
                || window._fgCapturedToken
                || localStorage.getItem(FG_DOC_XAUTH_KEY)
                || '';
        } catch (e) { return ''; }
    }

    function getStoredXAuthToken() {
        const live = getLiveToken();
        if (live && live !== localStorage.getItem(FG_DOC_XAUTH_KEY)) {
            try { localStorage.setItem(FG_DOC_XAUTH_KEY, live); } catch (e) {}
        }
        return live;
    }

    function setStoredXAuthToken(token) {
        try {
            localStorage.setItem(FG_DOC_XAUTH_KEY, token || '');
            logTerminal(`Stored X-AUTH-TOKEN (${token ? 'present' : 'empty'})`, token ? 'success' : 'warn');
        } catch (e) { logTerminal(`Failed storing token: ${e.message}`, 'error'); }
    }

    function promptForXAuthToken() {
        const t = window.prompt('Paste X-AUTH-TOKEN (auto-detected from ate_sct normally):', getLiveToken() || '');
        if (t !== null) setStoredXAuthToken(t.trim());
    }

    function showStoredTokenStatus() {
        const live = localStorage.getItem(FG_LIVE_SCT_KEY);
        const active = getLiveToken();
        if (!active) {
            logTerminal('No token available.', 'warn');
            alert('No X-AUTH-TOKEN found.\n\n1. ate_sct in localStorage (auto)\n2. XHR interceptor (auto)\n3. Manual via Set X-AUTH-TOKEN');
            return;
        }
        const source = live ? 'ate_sct (live session)' : window._fgCapturedToken ? 'XHR interceptor' : 'manual';
        logTerminal(`Token source: ${source} | length: ${active.length}`, 'success');
        alert(`X-AUTH-TOKEN active\nSource: ${source}\nLength: ${active.length}`);
    }

    function installTokenInterceptor() {
        if (window._fgTokenInterceptorInstalled) return;
        window._fgTokenInterceptorInstalled = true;
        const _origSet = XMLHttpRequest.prototype.setRequestHeader;
        XMLHttpRequest.prototype.setRequestHeader = function (h, v) {
            if (h.toLowerCase() === 'x-auth-token' && v && v.length > 20) {
                window._fgCapturedToken = v;
                try { localStorage.setItem(FG_DOC_XAUTH_KEY, v); } catch (e) {}
            }
            return _origSet.apply(this, arguments);
        };
        const _origFetch = window.fetch;
        window.fetch = function (...args) {
            const [, opts] = args;
            if (opts && opts.headers) {
                const t = opts.headers['x-auth-token'] || opts.headers['X-Auth-Token'] || '';
                if (t && t.length > 20) {
                    window._fgCapturedToken = t;
                    try { localStorage.setItem(FG_DOC_XAUTH_KEY, t); } catch (e) {}
                }
            }
            return _origFetch.apply(this, args);
        };
    }

    /* ================================================================
     *  CLOUD API
     * ================================================================ */
    async function apiJson(url, opts = {}) {
        const r = await fetch(url, {
            credentials: 'include', ...opts,
            headers: {
                'Accept': 'application/json, text/plain, */*',
                ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
                ...(opts.headers || {})
            }
        });
        if (!r.ok) {
            const t = await r.text().catch(() => '');
            throw new Error(`${r.status} ${r.statusText} :: ${t.slice(0, 250)}`);
        }
        const ct = r.headers.get('content-type') || '';
        return ct.includes('application/json') ? r.json() : r.text();
    }

    async function inquireJson(url) {
        const r = await fetch(url, { credentials: 'include' });
        if (!r.ok) {
            const t = await r.text().catch(() => '');
            throw new Error(`${r.status} ${r.statusText} :: ${t.slice(0, 250)}`);
        }
        return r.json();
    }

    async function getCloudDocument(prj, docId) {
        const token = getStoredXAuthToken();
        if (!token) throw new Error('No token. Use Set X-AUTH-TOKEN first.');
        return apiJson(`/api/cloud/project/${prj}/document/${docId}`, {
            method: 'GET',
            headers: { 'x-auth-token': token }
        });
    }

    async function patchCloudDocument(prj, docId, changes) {
        const token = getStoredXAuthToken();
        if (!token) throw new Error('No token. Use Set X-AUTH-TOKEN first.');
        const cur = await getCloudDocument(prj, docId);
        const payload = {
            id: Number(docId),
            name: cur.name ?? '',
            discipline: changes.discipline ?? cur.discipline ?? 'Not Specified',
            category: changes.category ?? cur.category ?? 'Not Specified',
            notes: Object.prototype.hasOwnProperty.call(cur, 'notes') ? cur.notes : null,
            status: changes.status ?? cur.status ?? ''
        };
        return apiJson(`/api/cloud/project/${prj}/document/${docId}`, {
            method: 'PATCH',
            headers: { 'x-auth-token': token },
            body: JSON.stringify(payload)
        });
    }

    /* ================================================================
     *  CHECKLIST STATUS
     * ================================================================ */
    async function getChecklistStatusForm(statusUrl) {
        if (!statusUrl) throw new Error('Status URL not found.');
        const r = await fetch(statusUrl, { credentials: 'include' });
        if (!r.ok) throw new Error(`Cannot load checklist form (${r.status}).`);
        const page = new DOMParser().parseFromString(await r.text(), 'text/html');
        const sf = page.querySelector('#id_status_field, #status_field, [name="status_field"]');
        const form = sf?.closest('form');
        if (!sf || !form) throw new Error('status_field not found on form.');
        return { page, form, statusField: sf };
    }

    function getChecklistStatusOptionsHtml(cur) {
        const n = (cur || '').toLowerCase();
        return CHECKLIST_STATUSES.map(s =>
            `<option value="${escapeAttr(s)}"${s.toLowerCase() === n ? ' selected' : ''}>${escapeHtml(s)}</option>`
        ).join('');
    }

    async function submitChecklistStatus(select, button) {
        const statusUrl = decodeURIComponent(select.dataset.statusUrl || '');
        const { form, statusField } = await getChecklistStatusForm(statusUrl);
        statusField.value = select.value;
        const fd = new FormData(form);
        fd.set(statusField.name || 'status_field', select.value);
        const base = new URL(statusUrl, window.location.href);
        const action = new URL(form.getAttribute('action') || base.href, base.href);
        const method = (form.getAttribute('method') || 'POST').toUpperCase();
        if (method === 'GET') for (const [k, v] of fd.entries()) action.searchParams.set(k, v);
        const r = await fetch(action.href, { method, credentials: 'include', body: method === 'GET' ? undefined : fd });
        if (!r.ok) throw new Error(`Checklist update failed (${r.status}).`);
        const label = gridCellText(select.options[select.selectedIndex]?.textContent || select.value);
        select.dataset.currentStatus = label;
        const sl = select.closest('.fg-checklist-group')?.querySelector('.fg-checklist-current-status');
        if (sl) sl.textContent = `Status: ${label}`;
        logTerminal(`Checklist ${select.dataset.checklistCode} → ${label}`, 'success');
        button.textContent = '✓ Saved';
        setTimeout(() => { if (button.isConnected) button.textContent = 'Submit Status'; }, 1400);
    }

    /* ================================================================
     *  QUESTION TEXT EXTRACTION (robust multi-fallback, from 3.0.1)
     * ================================================================ */
    function fieldValue(root, selector) {
        const field = root.querySelector(selector);
        if (!field) return '';
        return gridCellText(field.value || field.getAttribute('value') || field.textContent || '');
    }

    function cleanupQuestionText(text) {
        return gridCellText(text)
            .replace(/^(?:Question|Question Text)\s*:?\s*/i, '')
            .replace(/\b(?:Answer|Detail|Responsibility|Note)\s*:.*$/i, '')
            .replace(/\b(?:Yes|No|N\/A|NA|Pass|Fail|Acceptable|Not Acceptable)\b\s*$/i, '')
            .trim();
    }

    function nodeTextWithoutControls(node) {
        const clone = node.cloneNode(true);
        clone.querySelectorAll([
            'input','textarea','select','button','script','style',
            '.questionnaire-question-order-container',
            '.questionnaire_answer_detail','.questionnaire-answer-detail',
            '.questionnaire_detail','.questionnaire-detail',
            '.questionnaire_responsibility','.questionnaire-responsibility'
        ].join(',')).forEach(child => child.remove());
        return cleanupQuestionText(clone.textContent);
    }

    function getQuestionTextFromRow(row) {
        const directFieldText = fieldValue(row, 'textarea[name="QUESTION_question[]"], input[name="QUESTION_question[]"], [name="QUESTION_question[]"]')
            || fieldValue(row, '[name^="QUESTION_question"]')
            || fieldValue(row, '[name*="question_text"], [name*="QuestionText"]');
        if (directFieldText) return directFieldText;

        const questionSelectors = [
            'td.q-desc','td[class*="q-desc"]','td[class*="question"][class*="desc"]',
            '.questionnaire-question-text','.questionnaire_question_text',
            '.questionnaire-question-label','.questionnaire_question_label',
            '.questionnaire-question','.questionnaire_question',
            '.question-text','.question_text','.question-label','.question_label',
            '[data-question-text]','[data-question]'
        ];
        for (const selector of questionSelectors) {
            const el = row.querySelector(selector);
            const found = cleanupQuestionText(
                el?.getAttribute('data-question-text')
                || el?.getAttribute('data-question')
                || el?.textContent
                || ''
            );
            if (found) return found;
        }

        const cellCandidates = [...row.querySelectorAll('td, th')]
            .map(cell => nodeTextWithoutControls(cell))
            .filter(text => text
                && !/^\d+\.?$/.test(text)
                && !/^(?:yes|no|n\/a|na|pass|fail)$/i.test(text)
                && !/^yes\s*no\s*(?:n\/a|na)?$/i.test(text)
            );
        if (cellCandidates.length) {
            return cellCandidates.sort((a, b) => b.length - a.length)[0];
        }

        return nodeTextWithoutControls(row);
    }

    /* ================================================================
     *  INLINE QUESTIONNAIRE — PARSE + SAVE + RENDER
     * ================================================================ */

    function parseChecklistQuestionnaire(page) {
        const questionsRoot = page.querySelector('#id_QUESTIONS');
        if (!questionsRoot) return { status: 'incomplete', total: 0, answered: 0, attention: 0, questions: [] };

        let currentSection = 'Questionnaire';
        const questions = [];

        questionsRoot.querySelectorAll('tr').forEach(row => {
            if (row.classList.contains('questionnaire_subsection')) {
                currentSection = gridCellText(
                    row.querySelector('input[name="QUESTION_section[]"]')?.value
                    || row.querySelector('.questionnaire_section_subsection_text')?.textContent
                    || 'Questionnaire'
                );
                return;
            }
            if (!row.classList.contains('questionnaire_question_field')) return;

            const questionId = row.id || '';
            const checkedAnswer = row.querySelector('input[type="radio"][name^="QUESTION_answer_"]:checked')?.value;
            const storedAnswer = row.querySelector('input[name="QUESTION_check[]"]')?.value;
            const answer = gridCellText(checkedAnswer || storedAnswer || '');
            const noteRow = questionId ? page.getElementById(`${questionId}_c`) : null;

            questions.push({
                id: questionId,
                section: currentSection,
                number: gridCellText(
                    row.querySelector('.questionnaire-question-order-container')?.textContent
                    || row.querySelector('input[name="QUESTION_display_number[]"]')?.value
                ),
                question: getQuestionTextFromRow(row),
                answer,
                detail: gridCellText(row.querySelector('textarea[name="QUESTION_answer_detail[]"]')?.value),
                responsibility: gridCellText(row.querySelector('input[name="QUESTION_responsibility[]"]')?.value),
                note: gridCellText(noteRow?.textContent)
            });
        });

        const attention = questions.filter(q => q.answer.toLowerCase() === 'no').length;
        const answered  = questions.filter(q => q.answer).length;
        const status    = attention > 0 ? 'needs-attention'
                        : (questions.length > 0 && answered === questions.length ? 'complete' : 'incomplete');

        return { status, total: questions.length, answered, attention, questions };
    }

    async function getChecklistQuestionnaire(statusUrl) {
        if (!statusUrl) return { status: 'incomplete', total: 0, answered: 0, attention: 0, questions: [] };
        const r = await fetch(statusUrl, { credentials: 'include' });
        if (!r.ok) throw new Error(`Cannot load checklist page (${r.status}).`);
        return parseChecklistQuestionnaire(new DOMParser().parseFromString(await r.text(), 'text/html'));
    }

    // 'N/A', 'NA', 'n/a' all normalize to the same key so radio values match
    function normalizeAnswerValue(v) {
        return String(v || '').toLowerCase().replace(/[^a-z]/g, '');
    }

    // Save a single question answer by its DOM row ID (precise, avoids text-match ambiguity)
    async function saveQuestionAnswer(statusUrl, questionRowId, answerValue, detailText) {
        if (!statusUrl) throw new Error('Checklist URL not available.');
        const r = await fetch(statusUrl, { credentials: 'include' });
        if (!r.ok) throw new Error(`Cannot load checklist form (${r.status}).`);
        const page = new DOMParser().parseFromString(await r.text(), 'text/html');

        const row = page.getElementById(questionRowId);
        if (!row) throw new Error(`Question row #${questionRowId} not found on page.`);

        // Mutate radios in the parsed DOM before serialising (case/punctuation tolerant)
        const normAnswer = normalizeAnswerValue(answerValue);
        let radioMatched = false;
        row.querySelectorAll('input[type="radio"]').forEach(rad => {
            const match = normalizeAnswerValue(rad.value) === normAnswer;
            rad.checked = match;
            if (match) radioMatched = true;
        });

        // Some checklist layouts store the answer in a hidden field instead of
        // (or in addition to) radios — keep it in sync so either wins server-side.
        const hidden = row.querySelector('input[name="QUESTION_check[]"]');
        if (hidden) hidden.value = answerValue;
        if (!radioMatched && !hidden) throw new Error('No answer input (radio or hidden field) found for this question.');

        const ta = row.querySelector('textarea[name="QUESTION_answer_detail[]"]');
        if (ta) ta.value = detailText || '';

        const form = row.closest('form') || page.querySelector('form');
        if (!form) throw new Error('Form not found on checklist page.');

        const fd   = new FormData(form);
        const base = new URL(statusUrl, window.location.href);
        const act  = new URL(form.getAttribute('action') || base.href, base.href);
        const meth = (form.getAttribute('method') || 'POST').toUpperCase();
        if (meth === 'GET') for (const [k, v] of fd.entries()) act.searchParams.set(k, v);

        const resp = await fetch(act.href, { method: meth, credentials: 'include', body: meth === 'GET' ? undefined : fd });
        if (!resp.ok) throw new Error(`Save failed (${resp.status}).`);
    }

    function getQuestionnaireStatusColor(status) {
        if (status === 'complete') return '#2e7d32';
        if (status === 'needs-attention') return '#c62828';
        return '#8a6d3b';
    }

    function updateQuestionnaireSummaryLabel(checklistId, data) {
        const label = document.querySelector(`.fg-questionnaire-status[data-checklist-id="${checklistId}"]`);
        if (!label) return;
        label.textContent = `Questionnaire: ${data.status.replace('-', ' ')} (${data.answered}/${data.total})`;
        label.style.color = getQuestionnaireStatusColor(data.status);
    }

    // Populate the placeholder div inside a checklist row with editable questionnaire UI
    function renderInlineQuestionnaire(checklistId, data, statusUrl) {
        const container = document.querySelector(`.fg-questionnaire-inline[data-checklist-id="${checklistId}"]`);
        if (!container) return;

        const answerColor = { yes: '#2e7d32', no: '#c62828', 'n/a': '#5d4037', na: '#5d4037', '': '#888' };
        const statusBg    = data.status === 'complete' ? '#e8f5e9' : data.status === 'needs-attention' ? '#ffebee' : '#fff8e1';
        const statusColor = getQuestionnaireStatusColor(data.status);

        container.innerHTML = '';
        container.style.background = statusBg;
        container.style.border = `1px solid ${statusColor}40`;
        container.style.borderRadius = '4px';
        container.style.padding = '8px';
        container.style.marginTop = '6px';
        container.style.fontStyle = 'normal';
        container.style.color = '#333';

        // Summary bar
        const summary = document.createElement('div');
        summary.style.cssText = `font-size:11px;font-weight:bold;color:${statusColor};margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid ${statusColor}30;`;
        summary.textContent = `📋 Questionnaire — ${data.status.replace('-', ' ')} | ${data.answered}/${data.total} answered${data.attention ? ` | ⚠ ${data.attention} need attention` : ''}`;
        container.appendChild(summary);

        updateQuestionnaireSummaryLabel(checklistId, data);

        if (!data.questions.length) {
            const empty = document.createElement('div');
            empty.style.cssText = 'color:#999;font-style:italic;font-size:11px;padding:4px 0;';
            empty.textContent = 'No questionnaire questions found.';
            container.appendChild(empty);
            return;
        }

        let lastSection = '';
        data.questions.forEach(q => {
            // Section header
            if (q.section !== lastSection) {
                const hdr = document.createElement('div');
                hdr.style.cssText = `font-size:11px;font-weight:bold;color:#1b5e20;background:#e8f5e9;padding:4px 6px;border-left:3px solid ${BRAND_GREEN};margin:10px 0 6px 0;border-radius:2px;`;
                hdr.textContent = q.section;
                container.appendChild(hdr);
                lastSection = q.section;
            }

            // Question card
            const card = document.createElement('div');
            card.style.cssText = 'background:#fff;border:1px solid #e0e0e0;border-radius:3px;padding:7px 8px;margin-bottom:6px;';

            // Question text
            const qText = document.createElement('div');
            qText.style.cssText = 'font-size:12px;font-weight:bold;color:#333;margin-bottom:6px;';
            qText.textContent = `${q.number ? q.number + '. ' : ''}${q.question || '(Question text unavailable)'}`;
            card.appendChild(qText);

            // Responsibility (read-only meta)
            if (q.responsibility) {
                const meta = document.createElement('div');
                meta.style.cssText = 'font-size:10px;color:#888;margin-bottom:5px;';
                meta.textContent = `Responsibility: ${q.responsibility}`;
                card.appendChild(meta);
            }

            // Yes / No / N/A radios
            const radioRow = document.createElement('div');
            radioRow.style.cssText = 'display:flex;gap:12px;align-items:center;margin-bottom:6px;flex-wrap:wrap;';

            const radioId = `fg-q-${checklistId}-${q.id}`;
            ['Yes', 'No', 'N/A'].forEach(opt => {
                const lbl = document.createElement('label');
                lbl.style.cssText = 'display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer;font-weight:normal;';
                const rad = document.createElement('input');
                rad.type = 'radio';
                rad.name = radioId;
                rad.value = opt;
                rad.checked = normalizeAnswerValue(q.answer) === normalizeAnswerValue(opt);
                rad.style.cursor = 'pointer';
                lbl.append(rad, document.createTextNode(opt));
                radioRow.appendChild(lbl);
            });

            // Current answer badge
            const badge = document.createElement('span');
            badge.style.cssText = `margin-left:auto;font-size:10px;font-weight:bold;color:${answerColor[(q.answer||'').toLowerCase()] || '#888'};`;
            badge.textContent = q.answer ? `Current: ${q.answer}` : 'Unanswered';
            radioRow.appendChild(badge);
            card.appendChild(radioRow);

            // Detail textarea
            const detailRow = document.createElement('div');
            detailRow.style.cssText = 'display:flex;gap:6px;align-items:flex-start;';
            const ta = document.createElement('textarea');
            ta.rows = 2;
            ta.placeholder = 'Details (optional)…';
            ta.value = q.detail || '';
            ta.style.cssText = 'flex:1;font-size:11px;padding:4px 6px;border:1px solid #ccc;border-radius:3px;resize:vertical;font-family:Arial,sans-serif;';
            detailRow.appendChild(ta);

            // Save button
            const saveBtn = document.createElement('button');
            saveBtn.type = 'button';
            saveBtn.textContent = 'Save';
            saveBtn.style.cssText = `background:${BRAND_GREEN};color:#fff;border:none;padding:5px 12px;cursor:pointer;border-radius:3px;font-size:11px;font-weight:bold;white-space:nowrap;align-self:flex-end;`;
            saveBtn.onclick = async () => {
                const selectedRadio = card.querySelector(`input[name="${radioId}"]:checked`);
                if (!selectedRadio) return alert('Select Yes, No, or N/A first.');
                const answer  = selectedRadio.value;
                const detail  = ta.value.trim();
                saveBtn.disabled = true;
                saveBtn.textContent = 'Saving…';
                try {
                    await saveQuestionAnswer(statusUrl, q.id, answer, detail);
                    q.answer = answer;
                    q.detail = detail;
                    badge.textContent = `Current: ${answer}`;
                    badge.style.color = answerColor[answer.toLowerCase()] || '#888';
                    saveBtn.textContent = '✓ Saved';
                    saveBtn.style.background = '#388e3c';
                    logTerminal(`Q${q.number || q.id}: saved → "${answer}"`, 'success');
                    // Refresh the cached counts + summary label from local state
                    const cached = checklistQuestionnaireData.get(String(checklistId));
                    if (cached) {
                        cached.attention = cached.questions.filter(x => x.answer.toLowerCase() === 'no').length;
                        cached.answered  = cached.questions.filter(x => x.answer).length;
                        cached.status    = cached.attention > 0 ? 'needs-attention'
                                         : (cached.questions.length && cached.answered === cached.questions.length ? 'complete' : 'incomplete');
                        updateQuestionnaireSummaryLabel(checklistId, cached);
                        summary.textContent = `📋 Questionnaire — ${cached.status.replace('-', ' ')} | ${cached.answered}/${cached.total} answered${cached.attention ? ` | ⚠ ${cached.attention} need attention` : ''}`;
                    }
                    setTimeout(() => { if (saveBtn.isConnected) { saveBtn.textContent = 'Save'; saveBtn.style.background = BRAND_GREEN; saveBtn.disabled = false; } }, 1400);
                } catch (e) {
                    saveBtn.textContent = 'Save';
                    saveBtn.disabled = false;
                    saveBtn.style.background = BRAND_GREEN;
                    logTerminal(`Q${q.number || q.id} save failed: ${e.message}`, 'error');
                    alert(`Save failed: ${e.message}`);
                }
            };
            detailRow.appendChild(saveBtn);
            card.appendChild(detailRow);

            if (q.note) {
                const note = document.createElement('div');
                note.style.cssText = 'font-size:10px;color:#777;margin-top:5px;font-style:italic;';
                note.textContent = `Note: ${q.note}`;
                card.appendChild(note);
            }

            container.appendChild(card);
        });
    }

    // Background loader — populates inline questionnaire divs after audit
    function startQuestionnaireLoads(jobs, generation) {
        let idx = 0;
        const workers = Math.min(3, jobs.length);
        const run = async () => {
            while (idx < jobs.length && generation === questionnaireScanGeneration) {
                const job = jobs[idx++];
                const placeholder = document.querySelector(`.fg-questionnaire-inline[data-checklist-id="${job.id}"]`);
                try {
                    const data = await getChecklistQuestionnaire(job.statusUrl);
                    if (generation !== questionnaireScanGeneration) return;
                    checklistQuestionnaireData.set(String(job.id), data);
                    renderInlineQuestionnaire(job.id, data, job.statusUrl);
                } catch (e) {
                    if (generation !== questionnaireScanGeneration) return;
                    if (placeholder) {
                        placeholder.innerHTML = `<span style="font-size:11px;color:#c62828;">⚠ Questionnaire load failed: ${escapeHtml(e.message)}</span>`;
                    }
                    const label = document.querySelector(`.fg-questionnaire-status[data-checklist-id="${job.id}"]`);
                    if (label) { label.textContent = 'Questionnaire: load failed'; label.style.color = '#c62828'; }
                    logTerminal(`Questionnaire load failed for ${job.code}: ${e.message}`, 'warn');
                }
            }
        };
        for (let i = 0; i < workers; i++) run();
    }


    /* ================================================================
     *  UI HELPERS
     * ================================================================ */
    function updateCounter() {
        const total = document.querySelectorAll('.fg-doc').length;
        const sel = document.querySelectorAll('.fg-doc:checked').length;
        const el = document.getElementById('fg-counter');
        if (el) el.textContent = `Documents Loaded: ${total} | Selected: ${sel}`;
    }

    function logTerminal(msg, type = 'info') {
        const stream = document.getElementById('fg-terminal-stream');
        if (!stream) return;
        const ts = new Date().toISOString().slice(11, 19);
        const colors = { error: '#ff4444', warn: '#ffaa44', success: '#66ffcc', info: '#a6e22e' };
        const e = document.createElement('div');
        e.style.cssText = 'margin-bottom:3px; font-size:11px; line-height:1.5;';
        e.style.color = colors[type] || colors.info;
        const prefix = document.createElement('span');
        prefix.style.color = '#666';
        prefix.textContent = `[${ts}]`;
        e.appendChild(prefix);
        e.appendChild(document.createTextNode(` $ ${msg}`));
        stream.appendChild(e);
        stream.scrollTop = stream.scrollHeight;
    }

    function applyDocumentFilters() {
        const { type, category, discipline, status } = activeFilters;
        const search = (document.getElementById('fg-search')?.value || '').toLowerCase();
        document.querySelectorAll('#fg-results label').forEach(lbl => {
            const cb = lbl.querySelector('.fg-doc');
            if (!cb) return;
            const t = cb.dataset.doctype || '';
            const c = cb.dataset.category || '';
            const d = cb.dataset.discipline || '';
            const s = cb.dataset.status || '';
            const txt = lbl.textContent.toLowerCase();
            const pass =
                (type === 'All' || t === type) &&
                (category === 'All' || c === category) &&
                (discipline === 'All' || d === discipline) &&
                (status === 'All' || s === status) &&
                (!search || txt.includes(search));
            lbl.style.display = pass ? '' : 'none';
        });
        updateCounter();
    }

    function syncNativeDOMField(docId, field, value) {
        try {
            getTargetContexts().forEach(ctx => {
                const row = ctx.querySelector(`tr[id="${docId}"]`);
                if (!row) return;
                const selectors = {
                    status: 'td[aria-describedby*="status"]',
                    category: 'td[aria-describedby*="category"]',
                    discipline: 'td[aria-describedby*="discipline"]'
                };
                const sel = selectors[field];
                if (!sel) return;
                const cell = row.querySelector(sel);
                if (cell) { cell.textContent = value; cell.style.backgroundColor = '#fff9c4'; }
            });
        } catch (e) {}
    }

    function syncPanelLabel(cb, field, value) {
        const lbl = cb.closest('label');
        if (!lbl) return;
        const info = lbl.querySelector('.fg-doc-meta');
        if (!info) return;
        let txt = info.textContent || '';
        if (field === 'status') txt = txt.replace(/Status:\s*[^|]+/i, `Status: ${value}`);
        if (field === 'category') txt = txt.replace(/Category:\s*[^|]+/i, `Category: ${value}`);
        if (field === 'discipline') {
            txt = /Discipline:\s*[^|]+/i.test(txt)
                ? txt.replace(/Discipline:\s*[^|]+/i, `Discipline: ${value}`)
                : `${txt} | Discipline: ${value}`;
        }
        info.textContent = txt;
        if (field === 'status') cb.dataset.status = value;
        if (field === 'category') cb.dataset.category = value;
        if (field === 'discipline') cb.dataset.discipline = value;
    }

    function setDocumentBufferExpanded(open) {
        document.querySelectorAll('.fg-asset-group, .fg-checklist-group').forEach(g => g.open = open);
    }

    function closeDocumentBufferDialog() {
        const dlg = document.getElementById('fg-document-dialog');
        const res = document.getElementById('fg-results');
        const home = document.getElementById('fg-results-home');
        if (res && home) {
            res.style.maxHeight = '260px';
            res.style.height = '';
            res.style.flex = '';
            home.appendChild(res);
        }
        if (dlg) dlg.remove();
        const ob = document.getElementById('fg-open-document-buffer');
        if (ob) ob.disabled = false;
    }

    function openDocumentBufferDialog() {
        if (document.getElementById('fg-document-dialog')) return;
        const res = document.getElementById('fg-results');
        const ob = document.getElementById('fg-open-document-buffer');
        if (!res) return;
        const dlg = document.createElement('div');
        dlg.id = 'fg-document-dialog';
        dlg.style.cssText = `position:fixed;top:80px;left:80px;width:780px;height:640px;
            min-width:360px;min-height:240px;resize:both;overflow:hidden;display:flex;
            flex-direction:column;background:#fff;border:2px solid ${BRAND_BORDER};
            box-shadow:0 8px 32px rgba(0,0,0,.35);z-index:1000000;font-family:Arial,sans-serif;`;
        dlg.innerHTML = `
            <div id="fg-dlg-hdr" style="background:${BRAND_GREEN};color:#fff;padding:8px 10px;
                cursor:move;display:flex;justify-content:space-between;align-items:center;
                font-size:13px;font-weight:bold;user-select:none;flex-shrink:0;">
                <span>📂 Isolated Document Buffer</span>
                <span style="display:flex;gap:5px;">
                    <button id="fg-dlg-expand" type="button" style="background:#fff;color:#333;border:1px solid #ddd;border-radius:3px;padding:2px 8px;cursor:pointer;font-size:11px;">Expand All</button>
                    <button id="fg-dlg-collapse" type="button" style="background:#fff;color:#333;border:1px solid #ddd;border-radius:3px;padding:2px 8px;cursor:pointer;font-size:11px;">Collapse All</button>
                    <button id="fg-dlg-close" type="button" style="background:#fff;color:#333;border:1px solid #ddd;border-radius:3px;padding:2px 8px;cursor:pointer;font-size:11px;">✕ Close</button>
                </span>
            </div>
            <div id="fg-dlg-body" style="padding:8px;overflow:hidden;display:flex;flex:1;min-height:0;"></div>`;
        document.body.appendChild(dlg);
        res.style.maxHeight = 'none'; res.style.height = 'auto'; res.style.flex = '1';
        dlg.querySelector('#fg-dlg-body').appendChild(res);
        dlg.querySelector('#fg-dlg-expand').onclick = () => setDocumentBufferExpanded(true);
        dlg.querySelector('#fg-dlg-collapse').onclick = () => setDocumentBufferExpanded(false);
        dlg.querySelector('#fg-dlg-close').onclick = closeDocumentBufferDialog;
        if (ob) ob.disabled = true;
        const hdr = dlg.querySelector('#fg-dlg-hdr');
        let mv = false, ox = 0, oy = 0;
        hdr.addEventListener('mousedown', ev => {
            if (ev.target.tagName === 'BUTTON') return;
            const r = dlg.getBoundingClientRect(); mv = true;
            ox = ev.clientX - r.left; oy = ev.clientY - r.top; ev.preventDefault();
        });
        document.addEventListener('mousemove', ev => {
            if (!mv || !dlg.isConnected) return;
            dlg.style.left = Math.max(0, Math.min(ev.clientX - ox, window.innerWidth - 80)) + 'px';
            dlg.style.top  = Math.max(0, Math.min(ev.clientY - oy, window.innerHeight - 40)) + 'px';
        });
        document.addEventListener('mouseup', () => { mv = false; });
    }

    /* ================================================================
     *  NOTES POPUP
     * ================================================================ */
    function showNotesPopup(docId, notes) {
        docId = escapeHtml(docId);
        notes = escapeHtml(notes || '(No notes)');
        const existing = document.getElementById('fg-notes-popup');
        if (existing) existing.remove();
        const popup = document.createElement('div');
        popup.id = 'fg-notes-popup';
        popup.style.cssText = `position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
            background:#fff;border:2px solid ${BRAND_BORDER};border-radius:6px;padding:20px;
            width:420px;max-height:300px;overflow-y:auto;z-index:2000000;
            box-shadow:0 8px 32px rgba(0,0,0,.4);font-family:Arial,sans-serif;font-size:13px;`;
        popup.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <strong style="color:${BRAND_GREEN};">📝 Document Notes — ID: ${docId}</strong>
                <button id="fg-notes-close" style="background:none;border:none;font-size:18px;cursor:pointer;color:#666;">✕</button>
            </div>
            <div style="white-space:pre-wrap;color:#333;line-height:1.6;">${notes || '(No notes)'}</div>`;
        document.body.appendChild(popup);
        document.getElementById('fg-notes-close').onclick = () => popup.remove();
        document.addEventListener('keydown', function esc(e) {
            if (e.key === 'Escape') { popup.remove(); document.removeEventListener('keydown', esc); }
        });
    }

    /* ================================================================
     *  BACKGROUND DOC ENRICHMENT (discipline + notes)
     * ================================================================ */
    async function enrichDocumentsInBackground(prj) {
        const docs = document.querySelectorAll('.fg-doc');
        if (!docs.length) return;
        logTerminal(`Background enrichment starting for ${docs.length} document(s)...`, 'info');
        let enriched = 0;
        for (const cb of docs) {
            const docId = cb.getAttribute('data-docid');
            if (!docId) continue;
            try {
                const data = await getCloudDocument(prj, docId);
                if (!data || !data.id) continue;
                docMetaCache[docId] = { discipline: data.discipline || '', notes: data.notes || '' };
                cb.dataset.discipline = data.discipline || '';
                const lbl = cb.closest('label');
                if (lbl) {
                    // Patch discipline into meta span
                    const meta = lbl.querySelector('.fg-doc-meta');
                    if (meta && data.discipline && data.discipline !== 'Not Specified') {
                        meta.textContent = meta.textContent.replace(/Discipline:\s*[^|]+\|?\s*/i, '') + ` | Discipline: ${data.discipline}`;
                    }
                    // Add notes badge if notes exist
                    if (data.notes) {
                        const nameSpan = lbl.querySelector('.fg-doc-name');
                        if (nameSpan && !lbl.querySelector('.fg-notes-badge')) {
                            const badge = document.createElement('span');
                            badge.className = 'fg-notes-badge';
                            badge.title = 'Click to view notes';
                            badge.textContent = ' 📝';
                            badge.style.cssText = 'cursor:pointer;font-size:12px;';
                            badge.onclick = ev => { ev.stopPropagation(); ev.preventDefault(); showNotesPopup(docId, data.notes); };
                            nameSpan.appendChild(badge);
                        }
                    }
                }
                enriched++;
            } catch (e) { /* silent — enrichment is best-effort */ }
            await sleep(120);
        }
        logTerminal(`Enrichment complete. ${enriched}/${docs.length} docs annotated.`, 'success');
        // Rebuild discipline filter options from what was found
        const disciplines = new Set(['All']);
        document.querySelectorAll('.fg-doc').forEach(cb => { if (cb.dataset.discipline) disciplines.add(cb.dataset.discipline); });
        const discSel = document.getElementById('fg-filter-discipline');
        if (discSel) {
            const current = activeFilters.discipline || 'All';
            discSel.innerHTML = [...disciplines].map(d => `<option value="${escapeAttr(d)}">${escapeHtml(d)}</option>`).join('');
            discSel.value = disciplines.has(current) ? current : 'All';
            activeFilters.discipline = discSel.value;
            applyDocumentFilters();
        }
    }

    /* ================================================================
     *  DASHBOARD / CARDS
     * ================================================================ */
    function renderDashboardAndCards(filterType = 'All Assets') {
        const dash = document.getElementById('fg-dashboard');
        const cards = document.getElementById('fg-asset-cards');
        if (!dash || !cards) return;
        const T  = auditedAssetsData.length;
        const wI = auditedAssetsData.filter(a => a.issueCount > 0).length;
        const oI = auditedAssetsData.reduce((s, a) => s + a.openIssuesCount, 0);
        const gI = auditedAssetsData.reduce((s, a) => s + a.gatingIssuesCount, 0);
        const cA = auditedAssetsData.filter(a => a.status === 'Complete').length;
        const iA = auditedAssetsData.filter(a => a.status !== 'Complete').length;
        dash.innerHTML =
            '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;' +
                'background:linear-gradient(135deg,#f8f9fa,#e8f5e9);padding:10px;' +
                'border-radius:6px;font-size:12px;font-weight:bold;margin-bottom:12px;' +
                'border:1px solid #c8e6c9;">' +
                '<div style="color:#333;">Audited Assets<div style="font-weight:normal;font-size:14px;color:' + BRAND_GREEN + ';">' + T + '</div></div>' +
                '<div style="color:#c62828;">Assets w/ Issues<div style="font-weight:normal;font-size:14px;">' + wI + '</div></div>' +
                '<div style="color:#e65100;">Total Open Issues<div style="font-weight:normal;font-size:14px;">' + oI + '</div></div>' +
                '<div style="color:#c62828;">Gating Issues<div style="font-weight:normal;font-size:14px;">' + gI + '</div></div>' +
                '<div style="color:#2e7d32;">Complete Assets<div style="font-weight:normal;font-size:14px;">' + cA + '</div></div>' +
                '<div style="color:#1565c0;">Incomplete Assets<div style="font-weight:normal;font-size:14px;">' + iA + '</div></div>' +
            '</div>';
        let list = [...auditedAssetsData];
        if (filterType === 'Issues Only')  list = list.filter(a => a.issueCount > 0);
        if (filterType === 'Open Issues')  list = list.filter(a => a.openIssuesCount > 0);
        if (filterType === 'Gating Issues') list = list.filter(a => a.gatingIssuesCount > 0);
        if (filterType === 'Missing Docs') list = list.filter(a => a.missingDocs.length > 0);
        if (filterType === 'Complete')     list = list.filter(a => a.status === 'Complete');
        if (filterType === 'Incomplete')   list = list.filter(a => a.status !== 'Complete');
        let html = '';
        list.forEach((a, i) => {
            const badge = a.status === 'Complete' ? `<span style="color:#2e7d32;">✓</span>` : `<span style="color:#c62828;">!</span>`;
            const info = a.status === 'Has Issues' ? `Issues: ${a.openIssuesCount}` : `Missing: ${a.missingDocs.length}`;
            const cardIssues = (a.issueDetails || []).map(iss => ({
                ...iss,
                code: escapeHtml(iss.code || 'Issue'),
                status: escapeHtml(iss.status || '?'),
                description: escapeHtml(iss.description || '—')
            }));
            const cardDocs = (a.allDocsSummary || []).map(d => ({
                ...d,
                name: escapeHtml(d.name),
                type: escapeHtml(d.type),
                status: escapeHtml(d.status)
            }));
            html += `<div style="border:1px solid #e0e0e0;margin-bottom:6px;border-radius:4px;overflow:hidden;">
                <div class="fg-card-hdr" data-idx="${i}" style="background:#f5f5f5;padding:7px 10px;cursor:pointer;display:flex;justify-content:space-between;font-weight:bold;font-size:12px;align-items:center;user-select:none;">
                    <span>${badge} ${escapeHtml(a.name)}</span>
                    <span style="font-weight:normal;color:#888;font-size:11px;">[${info}] ▾</span>
                </div>
                <div id="fg-card-${i}" style="display:none;padding:10px;background:#fafafa;font-size:11px;border-top:1px solid #eee;max-height:220px;overflow-y:auto;">
                    <strong>Issues:</strong>
                    ${cardIssues.length
                        ? `<ul style="margin:4px 0 8px 16px;padding:0;">${cardIssues.map(iss =>
                            `<li style="margin-bottom:4px;"><strong>${iss.code||'Issue'}</strong> <span style="color:#888;">(${iss.status||'?'})</span><br>${iss.description||'—'}</li>`
                          ).join('')}</ul>`
                        : `<div style="color:#888;margin:4px 0 8px 0;">No issues.</div>`}
                    <strong>Documents:</strong>
                    <ul style="margin:4px 0 0 16px;padding:0;">${cardDocs.map(d =>
                        `<li>${d.name} <span style="color:#888;">(${d.type} → ${d.status})</span></li>`
                    ).join('')}</ul>
                </div>
            </div>`;
        });
        cards.innerHTML = html || '<p style="color:#999;font-style:italic;font-size:12px;">No assets match filter.</p>';
        document.querySelectorAll('.fg-card-hdr').forEach(h => {
            h.onclick = () => {
                const det = document.getElementById(`fg-card-${h.getAttribute('data-idx')}`);
                if (det) det.style.display = det.style.display === 'none' ? 'block' : 'none';
            };
        });
    }

    /* ================================================================
     *  DOWNLOAD / OPEN-IN-TAB PIPELINE
     * ================================================================ */
    const executeFilePipeline = async (openInTab = false) => {
        const docs = document.querySelectorAll('.fg-doc:checked');
        if (!docs.length) return alert('No documents checked.');
        const prj = getProjectId();
        logTerminal(`Interrogating ${docs.length} file(s) — mode: ${openInTab ? 'open-in-tab' : 'download'}`, 'info');
        let ok = 0;
        for (const doc of docs) {
            const docId = doc.getAttribute('data-docid');
            const url = `/inquire/?action=dwdcm&PID=${encodeURIComponent(docId)}&prj=${encodeURIComponent(prj)}`;
            try {
                const r = await fetch(url, { credentials: 'include', headers: { 'X-Requested-With': 'XMLHttpRequest' } });
                const txt = (await r.text()).trim();
                let src = null;
                try { src = JSON.parse(txt)?.src; } catch (e) {}
                if (!src) {
                    // fallback: try direct download URL
                    src = `/inquire/?action=dwdcm&PID=${encodeURIComponent(docId)}&prj=${encodeURIComponent(prj)}&ctrk=yes`;
                }
                if (openInTab) {
                    // Open-in-tab: use window.open so Chrome renders PDF natively
                    window.open(src, '_blank', 'noopener');
                } else {
                    // Download: force download via hidden anchor with download attr
                    const a = document.createElement('a');
                    a.href = src;
                    a.download = doc.closest('label')?.querySelector('.fg-doc-name')?.textContent?.trim() || `doc_${docId}`;
                    a.style.display = 'none';
                    document.body.appendChild(a); a.click(); a.remove();
                }
                ok++;
                logTerminal(`${openInTab ? '⧉ Tab opened' : '⬇ Downloaded'} — Doc ID: ${docId}`, 'success');
            } catch (e) { logTerminal(`Error on Doc ID: ${docId} — ${e.message}`, 'error'); }
            await sleep(openInTab ? 600 : 400); // slightly longer delay for tabs to avoid popup blocker
        }
        logTerminal(`Pipeline complete. ${ok}/${docs.length} file(s) ${openInTab ? 'opened in tab' : 'downloaded'}.`, ok === docs.length ? 'success' : 'warn');
    };

    /* ================================================================
     *  STATUS / CATEGORY / DISCIPLINE PATCH PIPELINE
     * ================================================================ */
    const pushGlobalAssetUpdates = async (field, value) => {
        const docs = document.querySelectorAll('.fg-doc:checked');
        if (!docs.length) return alert('No documents selected.');
        const prj = getProjectId();
        logTerminal(`Pushing ${field} → "${value}" on ${docs.length} doc(s) in project ${prj}...`, 'warn');
        let ok = 0;
        for (const cb of docs) {
            const docId = cb.getAttribute('data-docid');
            try {
                const result = await patchCloudDocument(prj, docId, { [field]: value });
                ok++;
                logTerminal(`✓ PATCH confirmed: Doc ${docId} | ${field} → ${value}`, 'success');
                syncNativeDOMField(docId, field, value);
                syncPanelLabel(cb, field, result?.[field] || value);
            } catch (e) {
                logTerminal(`✗ PATCH failed: Doc ${docId} :: ${e.message}`, 'error');
            }
            await sleep(200);
        }
        logTerminal(`Batch complete. ${ok}/${docs.length} committed.`, ok === docs.length ? 'success' : 'warn');
    };

    /* ================================================================
     *  PANEL CREATION
     * ================================================================ */
    function createPanel() {
        if (document.getElementById('fg-panel')) return;

        const catOptions = FG_CATEGORIES.map(c => `<option value="${escapeAttr(c)}">${escapeHtml(c)}</option>`).join('');
        const discOptions = FG_DISCIPLINES.map(d => `<option value="${escapeAttr(d)}">${escapeHtml(d)}</option>`).join('');

        const panel = document.createElement('div');
        panel.id = 'fg-panel';
        panel.style.cssText = 'position:fixed;top:80px;right:20px;width:700px;height:880px;' +
            'resize:both;overflow:hidden;background:#ffffff;border:2px solid ' + BRAND_BORDER + ';' +
            'padding:0;z-index:999999;box-shadow:0 6px 30px rgba(0,0,0,0.25);' +
            'font-family:Arial,sans-serif;display:flex;flex-direction:column;border-radius:4px;min-height:120px;';

        panel.innerHTML = `
            <!-- HEADER -->
            <div id="fg-header" style="background:linear-gradient(135deg,${BRAND_GREEN} 0%,#1b5e20 100%);
                color:#fff;padding:9px 12px;cursor:grab;font-weight:bold;display:flex;
                justify-content:space-between;align-items:center;user-select:none;
                flex-shrink:0;font-size:13px;letter-spacing:.5px;border-radius:2px 2px 0 0;">
                <span style="display:flex;align-items:center;gap:8px;">
                    <span style="font-size:16px;">⚙</span>
                    FacilityGrid Automation Suite
                    <span style="font-size:10px;opacity:.7;font-weight:normal;letter-spacing:1px;">v3.1.0</span>
                </span>
                <span style="display:flex;gap:10px;align-items:center;">
                    <button id="fg-max-toggle" type="button" style="background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);color:#fff;font-weight:bold;cursor:pointer;font-size:12px;padding:2px 8px;border-radius:3px;">[+]</button>
                    <button id="fg-min" type="button" style="background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);color:#fff;font-weight:bold;cursor:pointer;font-size:14px;padding:2px 8px;border-radius:3px;">−</button>
                </span>
            </div>

            <!-- BODY -->
            <div id="fg-body" style="display:flex;flex-direction:column;flex:1;overflow-y:auto;overflow-x:hidden;padding:12px;min-height:0;">

                <!-- RUN AUDIT -->
                <div style="display:flex;gap:8px;margin-bottom:10px;flex-shrink:0;">
                    <button id="fg-audit" type="button" style="background:linear-gradient(135deg,${BRAND_LIGHT},${BRAND_GREEN});color:#fff;border:none;padding:8px 18px;font-weight:bold;cursor:pointer;border-radius:4px;font-size:13px;letter-spacing:.3px;box-shadow:0 2px 6px rgba(46,125,50,.4);">
                        ▶ Run Asset Audit
                    </button>
                </div>

                <!-- AIRTABLE BULK PASTE (optional — leave empty to use native manual grid selection) -->
                <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;flex-shrink:0;align-items:center;">
                    <button id="fg-airtable-toggle" type="button" style="${ghostBtnStyle()}">📋 Airtable Bulk Paste ▾</button>
                    <span id="fg-airtable-status" style="font-size:11px;color:#888;"></span>
                </div>
                <div id="fg-airtable-drawer" style="display:none;flex-direction:column;gap:6px;margin-bottom:8px;padding:8px;background:#f8f9fa;border:1px solid #e0e0e0;border-radius:4px;flex-shrink:0;">
                    <span style="font-size:11px;color:#555;">Paste rows copied from Airtable (asset name/ID in the first column, one per line). Run Asset Audit will match these against the on-page grid — unmatched entries are searched live through the equipment grid's Unit filter. Leave empty to use the native manual-select workflow.</span>
                    <textarea id="fg-airtable-paste" rows="4" placeholder="AHU-1&#10;P-101&#10;CB-22..." style="width:100%;box-sizing:border-box;font-size:11px;font-family:'Courier New',monospace;padding:6px;border:1px solid #ccc;border-radius:4px;resize:vertical;"></textarea>
                    <div style="display:flex;gap:6px;">
                        <button id="fg-airtable-clear" type="button" style="${ghostBtnStyle()}">Clear Pasted Data</button>
                    </div>
                </div>

                <!-- DASHBOARD -->
                <div id="fg-dashboard" style="flex-shrink:0;"></div>

                <!-- TOOLBAR ROW 1: select/expand -->
                <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px;flex-shrink:0;">
                    <button id="fg-select-all"        type="button" style="${btnStyle()}">Select All Docs</button>
                    <button id="fg-clear-all"         type="button" style="${btnStyle()}">Clear All</button>
                    <button id="fg-expand-assets"     type="button" style="${btnStyle()}">Expand Assets</button>
                    <button id="fg-collapse-assets"   type="button" style="${btnStyle()}">Collapse Assets</button>
                    <button id="fg-expand-checklists" type="button" style="${btnStyle()}">Expand Checklists</button>
                    <button id="fg-collapse-checklists" type="button" style="${btnStyle()}">Collapse Checklists</button>
                </div>

                <!-- ASSET STATUS FILTER + DOC FILTERS -->
                <div id="fg-advanced-filters" style="display:none;flex-shrink:0;margin-bottom:8px;padding:8px;background:#f8f9fa;border:1px solid #e0e0e0;border-radius:4px;">
                    <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:6px;">
                        <span style="font-size:11px;font-weight:bold;color:#555;">Asset Filter:</span>
                        <select id="fg-filter-dropdown" style="${selStyle()}">
                            <option>All Assets</option>
                            <option>Issues Only</option>
                            <option>Open Issues</option>
                            <option>Gating Issues</option>
                            <option>Missing Docs</option>
                            <option>Complete</option>
                            <option>Incomplete</option>
                        </select>
                    </div>
                    <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;">
                        <span style="font-size:11px;font-weight:bold;color:#555;">Doc Filters:</span>
                        <select id="fg-filter-type" style="${selStyle()}"><option value="All">All Types</option></select>
                        <select id="fg-filter-category" style="${selStyle()}">
                            <option value="All">All Categories</option>${catOptions}
                        </select>
                        <select id="fg-filter-discipline" style="${selStyle()}">
                            <option value="All">All Disciplines</option>${discOptions}
                        </select>
                        <select id="fg-filter-status-doc" style="${selStyle()}">
                            <option value="All">All Statuses</option>
                            <option>Reviewed</option>
                            <option>Uploaded</option>
                            <option>Rejected</option>
                        </select>
                    </div>
                </div>

                <!-- COUNTER + SEARCH -->
                <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;flex-shrink:0;">
                    <div id="fg-counter" style="font-size:12px;font-weight:bold;color:#555;white-space:nowrap;">Documents Loaded: 0 | Selected: 0</div>
                </div>
                <input id="fg-search" type="text" placeholder="🔍 Search across files and assets..."
                    style="width:100%;box-sizing:border-box;margin-bottom:10px;padding:7px 10px;
                    background:#fff;border:1px solid #ddd;color:#333;font-size:12px;border-radius:4px;
                    outline:none;flex-shrink:0;">

                <!-- ASSET BREAKDOWN GRID -->
                <div style="margin-bottom:12px;">
                    <h4 style="margin:0 0 5px 0;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;font-weight:bold;">[+] Asset Breakdown Grid</h4>
                    <div id="fg-asset-cards" style="min-height:60px;max-height:200px;overflow-y:auto;border:1px solid #e0e0e0;padding:6px;background:#fff;border-radius:4px;">
                        <span style="color:#bbb;font-size:12px;">Run asset audit first.</span>
                    </div>
                </div>

                <!-- DOCUMENT BUFFER -->
                <div style="flex-grow:1;min-height:0;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
                        <h4 style="margin:0;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;font-weight:bold;">[+] Isolated Document Buffer Node</h4>
                        <span style="display:flex;gap:5px;">
                            <button id="fg-buffer-expand-all"  type="button" style="${btnStyle()}">Expand All</button>
                            <button id="fg-buffer-collapse-all" type="button" style="${btnStyle()}">Collapse All</button>
                            <button id="fg-open-document-buffer" type="button" style="${btnStyle()}">Open in Window</button>
                        </span>
                    </div>
                    <div id="fg-results-home">
                        <div id="fg-results" style="max-height:260px;overflow-y:auto;border:1px solid #e0e0e0;border-radius:4px;padding:6px;background:#fff;">
                            <span style="color:#bbb;font-size:12px;">No documentation telemetry initialized.</span>
                        </div>
                    </div>
                </div>

                <!-- TERMINAL — scrollable, not fixed -->
                <div style="flex-shrink:0;margin-top:10px;border-top:1px solid #eee;padding-top:8px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                        <div style="font-size:10px;color:#888;letter-spacing:1px;font-weight:bold;">[*] CORE_TERMINAL_LOG_STREAM</div>
                        <button id="fg-clear-terminal" type="button" style="font-size:10px;padding:1px 6px;cursor:pointer;background:#1a1a1a;color:#666;border:1px solid #333;border-radius:2px;">Clear</button>
                    </div>
                    <div id="fg-terminal-stream" style="background:#0d0d0d;border:1px solid #1a1a1a;border-radius:4px;padding:8px;height:110px;overflow-y:auto;font-family:'Courier New',monospace;font-size:11px;position:relative;"></div>
                </div>

                <!-- ACTION ROW: Download + Open Tab + Token (collapsible) -->
                <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;flex-shrink:0;align-items:center;">
                    <button id="fg-download"  type="button" style="${primaryBtnStyle()}">⬇ Download Checked Files</button>
                    <button id="fg-open-tab"  type="button" style="${primaryBtnStyle('#1565c0')}">⧉ Open in New Tab</button>
                    <button id="fg-token-toggle" type="button" style="${ghostBtnStyle()}">🔑 Token ▾</button>
                </div>
                <!-- Hidden token controls -->
                <div id="fg-token-drawer" style="display:none;flex-wrap:wrap;gap:6px;margin-top:4px;padding:6px 8px;background:#f8f9fa;border:1px solid #e0e0e0;border-radius:4px;flex-shrink:0;">
                    <button id="fg-set-token"  type="button" style="${ghostBtnStyle()}">Set X-AUTH-TOKEN</button>
                    <button id="fg-show-token" type="button" style="${ghostBtnStyle()}">Token Status</button>
                </div>

                <!-- ACTION ROW: Status + Category + Discipline — ALL ONE LINE WITH DROPDOWNS -->
                <div style="margin-top:8px;padding-top:8px;border-top:1px dashed #eee;flex-shrink:0;">
                    <div style="display:flex;flex-wrap:wrap;gap:5px;align-items:center;">
                        <span style="font-size:11px;font-weight:bold;color:#555;white-space:nowrap;">Status:</span>
                        <select id="fg-status-select" style="${selStyle('110px')}">
                            <option value="">— status —</option>
                            <option value="Reviewed">Reviewed</option>
                            <option value="Uploaded">Uploaded</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                        <button id="fg-apply-status" type="button" style="${primaryBtnStyle()}">Apply</button>
                        <span style="color:#ddd;font-size:13px;">|</span>
                        <span style="font-size:11px;font-weight:bold;color:#555;white-space:nowrap;">Cat:</span>
                        <select id="fg-category-select" style="${selStyle('130px')}">
                            <option value="">— category —</option>${catOptions}
                        </select>
                        <button id="fg-apply-category" type="button" style="${primaryBtnStyle()}">Apply</button>
                        <span style="color:#ddd;font-size:13px;">|</span>
                        <span style="font-size:11px;font-weight:bold;color:#555;white-space:nowrap;">Disc:</span>
                        <select id="fg-discipline-select" style="${selStyle('120px')}">
                            <option value="">— discipline —</option>${discOptions}
                        </select>
                        <button id="fg-apply-discipline" type="button" style="${primaryBtnStyle()}">Apply</button>
                    </div>
                    <!-- Bulk submit checklist status -->
                    <div style="display:flex;gap:6px;align-items:center;margin-top:6px;flex-wrap:wrap;">
                        <span style="font-size:11px;font-weight:bold;color:#555;white-space:nowrap;">Checklist Status:</span>
                        <select id="fg-bulk-checklist-status" style="${selStyle('140px')}">
                            ${CHECKLIST_STATUSES.map(s => `<option value="${escapeAttr(s)}">${escapeHtml(s)}</option>`).join('')}
                        </select>
                        <button id="fg-bulk-submit-status" type="button" style="${primaryBtnStyle('#6a1b9a')}">Submit Status — All Visible</button>
                    </div>
                </div>
            </div>`;

        document.body.appendChild(panel);
        panel.style.left = (window.innerWidth - panel.offsetWidth - 20) + 'px';
        panel.style.right = 'auto';

        const body = document.getElementById('fg-body');

        document.getElementById('fg-min').onclick = () => {
            if (body.style.display === 'none') { body.style.display = 'flex'; panel.style.height = isMaximized ? '95vh' : '880px'; }
            else { body.style.display = 'none'; panel.style.height = 'auto'; }
        };

        document.getElementById('fg-max-toggle').onclick = () => {
            if (!isMaximized) {
                panel.style.cssText += ';top:10px;left:10px;width:calc(100vw - 40px);height:calc(100vh - 40px);';
                document.getElementById('fg-max-toggle').textContent = '[-]';
                isMaximized = true;
            } else {
                panel.style.top = '80px'; panel.style.width = '700px'; panel.style.height = '880px';
                panel.style.left = (window.innerWidth - 720) + 'px';
                document.getElementById('fg-max-toggle').textContent = '[+]';
                isMaximized = false;
            }
        };

        document.getElementById('fg-audit').onclick = () => executeAuditScan();
        document.getElementById('fg-select-all').onclick = () => { document.querySelectorAll('.fg-doc').forEach(c => c.checked = true); updateCounter(); };
        document.getElementById('fg-clear-all').onclick = () => { document.querySelectorAll('.fg-doc').forEach(c => c.checked = false); updateCounter(); };
        document.getElementById('fg-expand-assets').onclick = () => document.querySelectorAll('.fg-asset-group').forEach(g => g.open = true);
        document.getElementById('fg-collapse-assets').onclick = () => document.querySelectorAll('.fg-asset-group').forEach(g => g.open = false);
        document.getElementById('fg-expand-checklists').onclick = () => document.querySelectorAll('.fg-checklist-group').forEach(g => g.open = true);
        document.getElementById('fg-collapse-checklists').onclick = () => document.querySelectorAll('.fg-checklist-group').forEach(g => g.open = false);
        document.getElementById('fg-buffer-expand-all').onclick = () => setDocumentBufferExpanded(true);
        document.getElementById('fg-buffer-collapse-all').onclick = () => setDocumentBufferExpanded(false);
        document.getElementById('fg-open-document-buffer').onclick = openDocumentBufferDialog;
        document.getElementById('fg-filter-dropdown').onchange = function () { renderDashboardAndCards(this.value); };

        // Doc filters
        ['fg-filter-type','fg-filter-category','fg-filter-discipline','fg-filter-status-doc'].forEach(id => {
            document.getElementById(id).onchange = function () {
                const map = { 'fg-filter-type':'type','fg-filter-category':'category','fg-filter-discipline':'discipline','fg-filter-status-doc':'status' };
                activeFilters[map[id]] = this.value;
                applyDocumentFilters();
            };
        });

        document.getElementById('fg-search').oninput = applyDocumentFilters;

        document.getElementById('fg-download').onclick = () => executeFilePipeline(false);
        document.getElementById('fg-open-tab').onclick = () => executeFilePipeline(true);
        document.getElementById('fg-token-toggle').onclick = () => {
            const d = document.getElementById('fg-token-drawer');
            const open = d.style.display === 'none';
            d.style.display = open ? 'flex' : 'none';
            document.getElementById('fg-token-toggle').textContent = open ? '🔑 Token ▴' : '🔑 Token ▾';
        };
        document.getElementById('fg-set-token').onclick = promptForXAuthToken;
        document.getElementById('fg-show-token').onclick = showStoredTokenStatus;
        document.getElementById('fg-airtable-toggle').onclick = () => {
            const d = document.getElementById('fg-airtable-drawer');
            const open = d.style.display === 'none';
            d.style.display = open ? 'flex' : 'none';
            document.getElementById('fg-airtable-toggle').textContent = open ? '📋 Airtable Bulk Paste ▴' : '📋 Airtable Bulk Paste ▾';
        };
        document.getElementById('fg-airtable-clear').onclick = () => {
            document.getElementById('fg-airtable-paste').value = '';
            document.getElementById('fg-airtable-status').textContent = '';
        };
        document.getElementById('fg-clear-terminal').onclick = () => {
            const t = document.getElementById('fg-terminal-stream');
            if (t) t.innerHTML = '';
        };
        document.getElementById('fg-apply-status').onclick = () => {
            const v = document.getElementById('fg-status-select').value;
            if (v) pushGlobalAssetUpdates('status', v);
            else alert('Please select a status first.');
        };
        document.getElementById('fg-apply-category').onclick = () => {
            const v = document.getElementById('fg-category-select').value;
            if (v) pushGlobalAssetUpdates('category', v);
        };
        document.getElementById('fg-apply-discipline').onclick = () => {
            const v = document.getElementById('fg-discipline-select').value;
            if (v) pushGlobalAssetUpdates('discipline', v);
        };
        document.getElementById('fg-bulk-submit-status').onclick = async () => {
            const targetStatus = document.getElementById('fg-bulk-checklist-status').value;
            if (!targetStatus) return alert('Pick a checklist status first.');
            const selects = [...document.querySelectorAll('.fg-checklist-status-select:not([disabled])')]
                .filter(sel => sel.offsetParent !== null || sel.getClientRects().length > 0);
            if (!selects.length) return alert('No checklist status selects found. Run audit first.');
            if (!confirm('Submit "' + targetStatus + '" on ALL ' + selects.length + ' visible checklist(s)?')) return;
            logTerminal('Bulk checklist status → "' + targetStatus + '" on ' + selects.length + ' checklist(s)...', 'warn');
            let ok = 0;
            for (const sel of selects) {
                sel.value = targetStatus;
                const btn = sel.parentElement?.querySelector('.fg-checklist-status-submit');
                if (!btn) continue;
                try {
                    await submitChecklistStatus(sel, btn);
                    ok++;
                } catch (e) { logTerminal('Checklist ' + sel.dataset.checklistCode + ' failed: ' + e.message, 'error'); }
                await sleep(400);
            }
            logTerminal('Bulk checklist complete. ' + ok + '/' + selects.length + ' submitted.', ok === selects.length ? 'success' : 'warn');
        };

        setTimeout(() => {
            logTerminal('FG Automation Suite v3.1.0 online.', 'success');
            const tok = getLiveToken();
            logTerminal(tok ? `Auto-token detected (length: ${tok.length}).` : 'No token yet — trigger any FG action.', tok ? 'success' : 'warn');
        }, 300);
    }

    /* ================================================================
     *  STYLE HELPERS
     * ================================================================ */
    function btnStyle() {
        return 'padding:4px 9px;font-size:11px;cursor:pointer;background:#fff;border:1px solid #ccc;border-radius:3px;color:#333;';
    }
    function primaryBtnStyle(bg = BRAND_GREEN) {
        return `background:${bg};color:#fff;border:none;padding:6px 14px;cursor:pointer;border-radius:4px;font-weight:bold;font-size:11px;`;
    }
    function ghostBtnStyle() {
        return 'background:#fff;color:#555;border:1px solid #bbb;padding:6px 12px;cursor:pointer;border-radius:4px;font-weight:bold;font-size:11px;';
    }
    function selStyle(w = 'auto') {
        return `font-size:11px;padding:3px 5px;background:#fff;color:#333;border:1px solid #ccc;border-radius:3px;max-width:${w === 'auto' ? '160px' : w};`;
    }

    /* ================================================================
     *  PASTED-ASSET MATCHING (Airtable paste + live grid search)
     * ================================================================ */
    function normalizeId(s) {
        // Strips everything but letters/digits so formatting differences (missing or
        // extra hyphens, dots, spaces, case) don't break a match.
        return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    function levenshtein(a, b) {
        const m = a.length, n = b.length;
        if (!m) return n;
        if (!n) return m;
        const dp = new Array(n + 1);
        for (let j = 0; j <= n; j++) dp[j] = j;
        for (let i = 1; i <= m; i++) {
            let prev = dp[0];
            dp[0] = i;
            for (let j = 1; j <= n; j++) {
                const tmp = dp[j];
                dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
                prev = tmp;
            }
        }
        return dp[n];
    }

    function collectGridRowText(ctxs) {
        // rows: id -> full lowercase row text (broad substring fallback)
        // units: [{id, raw, norm}] specific unit-identifier candidates, used for
        //        punctuation-normalized and fuzzy matching tiers.
        const rows = new Map();
        const units = [];

        ctxs.forEach(ctx => {
            ctx.querySelectorAll('tr.jqgrow[id]').forEach(tr => {
                if (rows.has(tr.id)) return;
                rows.set(tr.id, tr.textContent.replace(/\s+/g, ' ').trim().toLowerCase());
                const unitCell = tr.querySelector('td[aria-describedby="eq_list_unit"], td[aria-describedby$="_unit"]');
                const unitVal = unitCell ? (unitCell.getAttribute('title') || unitCell.textContent || '').trim() : '';
                if (unitVal) units.push({ id: tr.id, raw: unitVal, norm: normalizeId(unitVal) });
            });
        });

        try {
            const $ = window.jQuery || window.$;
            if ($ && $.fn && $.fn.jqGrid) {
                const candidates = ['#eq_list', 'table.ui-jqgrid-btable'];
                for (const sel of candidates) {
                    const $g = $(sel).first();
                    if (!$g.length || !$g.jqGrid) continue;
                    let data;
                    try { data = $g.jqGrid('getGridParam', 'data'); } catch (e) { continue; }
                    if (Array.isArray(data) && data.length) {
                        data.forEach(r => {
                            if (r && r.id != null) {
                                const id = String(r.id);
                                if (!rows.has(id)) rows.set(id, Object.values(r).join(' ').toLowerCase());
                                const unitVal = r.unit || r.Unit || r.unit_no || '';
                                if (unitVal && !units.some(u => u.id === id)) {
                                    units.push({ id, raw: String(unitVal), norm: normalizeId(unitVal) });
                                }
                            }
                        });
                        break;
                    }
                }
            }
        } catch (e) { /* jqGrid not introspectable here — DOM scan above still applies */ }

        return { rows, units };
    }

    async function forceFullGridLoad() {
        try {
            const $ = window.jQuery || window.$;
            if (!$ || !$.fn || !$.fn.jqGrid) return false;
            const $g = ($('#eq_list').length ? $('#eq_list') : $('table.ui-jqgrid-btable').first());
            if (!$g.length || !$g.jqGrid) return false;
            const current = parseInt($g.jqGrid('getGridParam', 'rowNum'), 10) || 0;
            if (current >= 5000) return false; // already expanded, nothing more to do
            logTerminal('No match on current page — expanding grid to load the full equipment list...', 'warn');
            await new Promise(resolve => {
                let done = false;
                const finish = () => { if (!done) { done = true; resolve(); } };
                $g.one('jqGridLoadComplete', finish);
                try {
                    $g.jqGrid('setGridParam', { rowNum: 5000 });
                    $g.trigger('reloadGrid', [{ page: 1 }]);
                } catch (e) { finish(); }
                setTimeout(finish, 6000); // safety timeout if the event never fires
            });
            return true;
        } catch (e) { return false; }
    }

    /* ----- live grid search (from 3.0.1) — last-resort tier for pasted
     *       identifiers that aren't in the currently loaded rows ----- */
    function getEquipmentGridSignature(ctxs) {
        const ids = [];
        ctxs.forEach(ctx => ctx.querySelectorAll('tr.jqgrow[id]').forEach(tr => ids.push(tr.id)));
        return ids.join('|');
    }

    function getEquipmentSearchControls(ctxs) {
        for (const ctx of ctxs) {
            const searchInput = ctx.getElementById('gs_unit');
            const grid = ctx.getElementById('eq_list');
            if (searchInput && grid) return { ctx, searchInput, grid };
        }
        return null;
    }

    function findEquipmentFilterButton(ctxs) {
        for (const ctx of ctxs) {
            const filterIcon = ctx.querySelector('img[title="Filter Results"][data-icon-name="toolbar-filter"], img[src*="toolbar-filter"]');
            const filterButton = filterIcon?.closest('a, button');
            if (filterButton) return { ctx, filterButton };
        }
        return null;
    }

    async function ensureEquipmentSearchControls(ctxs) {
        let controls = getEquipmentSearchControls(ctxs);
        if (controls) return controls;

        const filterTarget = findEquipmentFilterButton(ctxs);
        if (filterTarget) {
            logTerminal('Equipment Unit filter textbox is hidden. Opening native Filter Results controls.', 'info');
            try {
                const view = filterTarget.ctx.defaultView || window;
                if (typeof view.shFlt === 'function') {
                    view.shFlt('eq_list');
                } else if (typeof window.shFlt === 'function') {
                    window.shFlt('eq_list');
                } else {
                    filterTarget.filterButton.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
                }
            } catch (e) {
                logTerminal(`Unable to press native filter button: ${e.message}`, 'warn');
            }
        }

        const started = Date.now();
        while (Date.now() - started < 3000) {
            controls = getEquipmentSearchControls(ctxs);
            if (controls) return controls;
            await sleep(150);
        }
        return null;
    }

    async function waitForEquipmentGridSearch(ctxs, previousSignature) {
        const started = Date.now();
        let sawLoading = false;
        while (Date.now() - started < 6500) {
            const loading = document.getElementById('load_eq_list');
            const currentSignature = getEquipmentGridSignature(ctxs);
            const isLoading = loading && loading.style.display !== 'none';
            if (isLoading) sawLoading = true;
            if (!isLoading && currentSignature && currentSignature !== previousSignature) return true;
            if (!isLoading && sawLoading) return true;
            if (!isLoading && Date.now() - started > 1500) return true;
            await sleep(150);
        }
        return false;
    }

    async function searchEquipmentGridByUnit(token, ctxs) {
        const controls = await ensureEquipmentSearchControls(ctxs);
        if (!controls) return false;

        const previousSignature = getEquipmentGridSignature(ctxs);
        const { searchInput, grid } = controls;
        const jq = window.jQuery || window.$;

        searchInput.value = token;
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        searchInput.dispatchEvent(new Event('change', { bubbles: true }));
        searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
        searchInput.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));

        if (jq && typeof jq === 'function') {
            try {
                const gridApi = jq(grid);
                if (gridApi && typeof gridApi.jqGrid === 'function') {
                    gridApi.jqGrid('setGridParam', {
                        search: true,
                        postData: {
                            unit: token,
                            _search: true,
                            searchField: 'unit',
                            searchOper: 'cn',
                            searchString: token
                        },
                        page: 1
                    });
                    gridApi.trigger('reloadGrid', [{ page: 1 }]);
                }
            } catch (e) {
                logTerminal(`Native grid search fallback used for ${token}: ${e.message}`, 'warn');
            }
        }

        await waitForEquipmentGridSearch(ctxs, previousSignature);
        return true;
    }

    function markAssetChecked(pid, ctxs) {
        ctxs.forEach(ctx => {
            const checkbox = ctx.getElementById(`jqg_eq_list_${pid}`) || ctx.querySelector(`input.cbox[id$="_${pid}"]`);
            if (checkbox) {
                checkbox.checked = true;
                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
    }

    function getPastedIdentifiers() {
        const ta = document.getElementById('fg-airtable-paste');
        const raw = (ta?.value || '').trim();
        if (!raw) return null; // no paste data → caller falls back to native checkbox mode
        const identifiers = raw.split(/[;\r\n]+/)
            .map(line => (line.split('\t')[0] || line.split(',')[0] || line).trim())
            .filter(Boolean);
        return identifiers.length ? identifiers : null;
    }

    // Single-identifier matcher — exact substring, punctuation-normalized, then fuzzy
    function matchOneIdentifier(idStr, rows, units) {
        const needle = idStr.toLowerCase();
        const normNeedle = normalizeId(idStr);

        // Tier 1 — exact substring on raw row text (fast path, no typos)
        for (const [rid, text] of rows) {
            if (text.includes(needle)) return { hitId: rid, fuzzy: false };
        }

        // Tier 2 — exact match ignoring punctuation/case (missing or extra
        // hyphens, dots, spaces — e.g. "OHD10D620.01C" vs "OHD-10D620.01C")
        const u2 = units.find(u => u.norm === normNeedle);
        if (u2) return { hitId: u2.id, fuzzy: false };

        // Tier 3 — fuzzy match via edit distance, for genuine character-level
        // typos. Threshold scales with identifier length, capped small so it
        // doesn't start guessing wildly on short codes.
        if (units.length && normNeedle.length >= 4) {
            let best = null, bestDist = Infinity;
            for (const u of units) {
                const d = levenshtein(normNeedle, u.norm);
                if (d < bestDist) { bestDist = d; best = u; }
            }
            const threshold = Math.min(3, Math.max(1, Math.ceil(normNeedle.length * 0.12)));
            if (best && bestDist <= threshold) return { hitId: best.id, fuzzy: true };
        }

        return { hitId: null, fuzzy: false };
    }

    async function matchPastedIdentifiers(identifiers, ctxs) {
        let { rows, units } = collectGridRowText(ctxs);
        logTerminal(`Searching ${rows.size} loaded asset row(s) for ${identifiers.length} pasted identifier(s)...`, 'info');

        const tryMatchAll = () => {
            const pids = [], matched = [], fuzzyMatched = [], unmatched = [];
            identifiers.forEach(idStr => {
                // Numeric paste entries are treated as direct asset IDs
                if (/^\d+$/.test(idStr)) {
                    pids.push(idStr);
                    matched.push(idStr);
                    return;
                }
                const { hitId, fuzzy } = matchOneIdentifier(idStr, rows, units);
                if (hitId) {
                    pids.push(hitId);
                    if (fuzzy) fuzzyMatched.push(idStr); else matched.push(idStr);
                } else {
                    unmatched.push(idStr);
                }
            });
            return { pids, matched, fuzzyMatched, unmatched };
        };

        let result = tryMatchAll();

        // Tier 4a — expand the grid page size so every loaded asset is searchable
        if (result.unmatched.length) {
            const expanded = await forceFullGridLoad();
            if (expanded) {
                ({ rows, units } = collectGridRowText(ctxs));
                logTerminal(`Grid expanded — now searching ${rows.size} loaded asset row(s).`, 'info');
                result = tryMatchAll();
            }
        }

        // Tier 4b — live server-side grid search per remaining token (from 3.0.1)
        if (result.unmatched.length) {
            const stillUnmatched = [];
            for (const token of result.unmatched) {
                logTerminal(`Searching equipment grid for pasted asset: ${token}`, 'info');
                const searched = await searchEquipmentGridByUnit(token, ctxs);
                if (searched) {
                    ({ rows, units } = collectGridRowText(ctxs));
                    const { hitId, fuzzy } = matchOneIdentifier(token, rows, units);
                    if (hitId) {
                        result.pids.push(hitId);
                        if (fuzzy) result.fuzzyMatched.push(token); else result.matched.push(token);
                        markAssetChecked(hitId, ctxs);
                        continue;
                    }
                }
                stillUnmatched.push(token);
            }
            result.unmatched = stillUnmatched;
        }

        const totalMatched = result.matched.length + result.fuzzyMatched.length;
        const statusEl = document.getElementById('fg-airtable-status');
        if (statusEl) statusEl.textContent = `${totalMatched}/${identifiers.length} matched`;
        logTerminal(`Pasted assets: ${totalMatched}/${identifiers.length} matched.`, totalMatched === identifiers.length ? 'success' : 'warn');
        if (result.fuzzyMatched.length) logTerminal(`Fuzzy-matched (formatting/typo tolerated): ${result.fuzzyMatched.join(', ')}`, 'warn');
        if (result.unmatched.length) logTerminal(`Unmatched: ${result.unmatched.join(', ')} — confirm these exist in this project and aren't filtered out of the grid.`, 'warn');

        return [...new Set(result.pids)];
    }

    /* ================================================================
     *  AUDIT SCAN
     * ================================================================ */
    async function executeAuditScan() {
        const ctxs = getTargetContexts();

        // Native checkbox selection — always collected, regardless of paste state.
        let checked = [];
        ctxs.forEach(ctx => {
            checked = checked.concat([...ctx.querySelectorAll('input.cbox:checked, .jqgrow input[type="checkbox"]:checked')]);
        });
        const nativePids = checked.map(cb => cb.id.replace('jqg_eq_list_', '').replace('jqg_', ''));

        // Pasted identifiers — optional, resolved on top of native selection.
        const pastedIdentifiers = getPastedIdentifiers();
        let pastedPids = [];
        if (pastedIdentifiers && pastedIdentifiers.length) {
            pastedPids = await matchPastedIdentifiers(pastedIdentifiers, ctxs);
        }

        const pids = [...new Set([...nativePids, ...pastedPids])];

        if (nativePids.length && pastedPids.length) {
            logTerminal(`Combining ${nativePids.length} natively-checked asset(s) with ${pastedPids.length} paste-matched asset(s) → ${pids.length} unique asset(s) total.`, 'info');
        } else if (pastedPids.length) {
            logTerminal(`Using ${pastedPids.length} asset(s) resolved from paste.`, 'info');
        } else if (nativePids.length) {
            logTerminal(`Using ${nativePids.length} natively-checked asset(s).`, 'info');
        }

        if (!pids.length) {
            logTerminal('HALTED: No assets checked on grid and no paste data resolved.', 'error');
            alert('No equipment checked on page grid, and no asset list pasted/matched.');
            return;
        }

        logTerminal(`Starting deep scan on ${pids.length} entries...`, 'info');
        const res = document.getElementById('fg-results');
        res.innerHTML = '<span style="color:#0275d8;font-size:12px;font-weight:bold;">Extracting equipment metadata mappings...</span>';

        const foundTypes = new Set();
        let html = '';
        auditedAssetsData = [];
        docMetaCache = {};
        activeFilters = { type: 'All', category: 'All', discipline: 'All', status: 'All' };
        const prj = getProjectId();
        const questionnaireJobs = [];
        const questionnaireGeneration = ++questionnaireScanGeneration;
        checklistQuestionnaireData.clear();

        for (const pid of pids) {
            if (!pid || isNaN(pid)) continue;
            try {
                let assetName = `ID_${pid}`;
                ctxs.forEach(ctx => {
                    const row = ctx.querySelector(`tr[id="${pid}"], tr.jqgrow[id="${pid}"]`);
                    if (row) {
                        const cell = row.querySelector('td[aria-describedby="eq_list_unit"]');
                        if (cell?.getAttribute('title')) assetName = cell.getAttribute('title').trim();
                    }
                });

                const clData = await inquireJson(`/inquire/?action=custgfp&ctp=Checklist&custp=eqp&PID=${encodeURIComponent(pid)}&prj=${encodeURIComponent(prj)}`);
                if (!clData.rows?.length) continue;

                const checklists = clData.rows.map(getChecklistMetadata)
                    .sort((a, b) => a.subtask.localeCompare(b.subtask, undefined, { numeric: true, sensitivity: 'base' }));
                logTerminal(`Matched ${checklists.length} sub-checklist(s) beneath ${assetName}`, 'info');
                const safeAssetName = escapeHtml(assetName);

                html += `<details class="fg-asset-group" open style="margin:10px 0;border:1px solid #c8e6c9;border-radius:5px;background:#f8faf8;overflow:hidden;">
                    <summary style="padding:8px 10px;cursor:pointer;background:#e8f5e9;color:#1b5e20;font-size:13px;font-weight:bold;border-left:4px solid ${BRAND_GREEN};user-select:none;">
                        <span style="display:inline-flex;width:calc(100% - 22px);justify-content:space-between;align-items:center;gap:8px;vertical-align:middle;">
                            <span>Asset: ${safeAssetName} __FG_ASSET_COUNTS_${pid}__</span>
                            <span style="display:flex;gap:5px;flex-shrink:0;">
                                <button type="button" class="fg-asset-expand-checklists" style="${btnStyle()}">Expand All</button>
                                <button type="button" class="fg-asset-collapse-checklists" style="${btnStyle()}">Collapse All</button>
                            </span>
                        </span>
                    </summary>
                    <div style="padding:8px;">`;

                const presentTypes = new Set();
                const allDocsSummary = [];

                for (const cl of checklists) {
                    const safeClSubtask = escapeHtml(cl.subtask);
                    const safeClName = escapeHtml(cl.name);
                    const safeClStatus = escapeHtml(cl.status);
                    const docsData = await inquireJson(`/inquire/?action=docsgfp&dcmp=chk&PID=${encodeURIComponent(cl.id)}&prj=${encodeURIComponent(prj)}`);
                    const rows = docsData.rows || [];

                    html += `<details class="fg-checklist-group" open style="margin:0 0 6px 0;border:1px solid #e0e0e0;border-radius:4px;background:#fff;overflow:hidden;">
                        <summary style="padding:7px 9px;cursor:pointer;background:#f5f5f5;color:#333;font-size:12px;font-weight:bold;border-left:3px solid ${BRAND_LIGHT};user-select:none;">
                            <span style="display:inline-flex;width:calc(100% - 22px);justify-content:space-between;align-items:center;gap:8px;vertical-align:middle;">
                                <span>
                                    ${safeClSubtask} | ${safeClName} (${rows.length} doc${rows.length !== 1 ? 's' : ''})
                                    <span style="display:block;font-size:11px;font-weight:normal;margin-top:2px;">
                                        <span class="fg-checklist-current-status" style="color:#777;">Status: ${safeClStatus}</span>
                                        ${cl.statusUrl ? `<span style="color:#bbb;"> | </span><span class="fg-questionnaire-status" data-checklist-id="${escapeAttr(cl.id)}" style="color:#999;font-weight:bold;">Questionnaire: loading…</span>` : ''}
                                    </span>
                                </span>
                                <span class="fg-checklist-status-controls" style="display:flex;gap:5px;align-items:center;flex-shrink:0;">
                                    <select class="fg-checklist-status-select"
                                        data-checklist-id="${escapeAttr(cl.id)}" data-checklist-code="${escapeAttr(cl.subtask)}"
                                        data-current-status="${escapeAttr(cl.status)}" data-status-url="${escapeAttr(encodeURIComponent(cl.statusUrl))}"
                                        style="max-width:140px;padding:3px;font-size:11px;" ${cl.statusUrl ? '' : 'disabled'}>
                                        ${getChecklistStatusOptionsHtml(cl.status)}
                                    </select>
                                    <button type="button" class="fg-checklist-status-submit"
                                        style="padding:3px 8px;font-size:11px;cursor:pointer;background:${BRAND_GREEN};color:#fff;border:none;border-radius:3px;"
                                        ${cl.statusUrl ? '' : 'disabled'}>Submit Status</button>
                                </span>
                            </span>
                        </summary>
                        <div style="padding:4px 8px;">`;

                    if (!rows.length) html += '<div style="padding:8px;color:#bbb;font-size:11px;font-style:italic;">No documents attached.</div>';

                    for (const row of rows) {
                        const docId = row.id;
                        const docName = row.cell[2] || '';
                        const category = row.cell[3] || '';
                        const status = row.cell[4] || '';
                        const docType = getDocType(docName);
                        const safeDocId = escapeAttr(docId);
                        const safeDocName = escapeHtml(docName);
                        const safeDocType = escapeHtml(docType);
                        const safeCategory = escapeHtml(category);
                        const safeStatus = escapeHtml(status);

                        foundTypes.add(docType);
                        if (docType !== 'Other') presentTypes.add(docType);
                        allDocsSummary.push({ name: docName, type: docType, status, checklistId: cl.id, checklistSubtask: cl.subtask, checklistName: cl.name });

                        html += `<label style="display:block;margin-bottom:4px;padding:6px 8px;border-bottom:1px solid #f5f5f5;
                            font-size:12px;line-height:1.5;background:#fff;color:#333;cursor:pointer;border-radius:3px;
                            transition:background .15s;" onmouseover="this.style.background='#f9f9f9'" onmouseout="this.style.background='#fff'">
                            <input type="checkbox" class="fg-doc"
                                data-docid="${safeDocId}"
                                data-doctype="${escapeAttr(docType)}"
                                data-category="${escapeAttr(category)}"
                                data-status="${escapeAttr(status)}"
                                data-discipline=""
                                style="margin-right:6px;cursor:pointer;">
                            <strong class="fg-doc-name" style="color:#1565c0;">${safeDocName}</strong><br>
                            <span class="fg-doc-meta" style="color:#777;font-size:11px;">Type: ${safeDocType} | Status: ${safeStatus} | Category: ${safeCategory}</span>
                        </label>`;
                    }

                    html += '</div>';
                    // Questionnaire inline placeholder — populated by background loader
                    if (cl.statusUrl) {
                        html += `<div class="fg-questionnaire-inline" data-checklist-id="${escapeAttr(cl.id)}"
                            style="margin:4px 8px 8px 8px;padding:8px;background:#f5f5f5;border-radius:4px;font-size:11px;color:#888;font-style:italic;">
                            📋 Loading questionnaire…</div>`;
                        questionnaireJobs.push({ id: cl.id, code: cl.subtask, statusUrl: cl.statusUrl });
                    }
                    html += '</details>';
                }

                html += '</div></details>';
                html = html.replace(`__FG_ASSET_COUNTS_${pid}__`,
                    `(${checklists.length} checklist${checklists.length !== 1 ? 's' : ''}) (${allDocsSummary.length} doc${allDocsSummary.length !== 1 ? 's' : ''})`);

                const issuesData = await inquireJson(`/inquire/?action=issgfp&issp=eqp&PID=${encodeURIComponent(pid)}&prj=${encodeURIComponent(prj)}`);
                const issueRows = issuesData.rows || [];
                let openIssues = 0;
                const issueDetails = issueRows.map(r => {
                    const c = r.cell || [];
                    if ((c[3] || '').toLowerCase() !== 'closed') openIssues++;
                    return { issueId: r.id, code: c[2]||'', status: c[3]||'', priority: c[4]||'', description: c[5]||'', issueType: c[6]||'', responsibility: c[8]||'' };
                });

                const missingDocs = REQUIRED_DOCS.filter(t => !presentTypes.has(t));
                auditedAssetsData.push({
                    pid, name: assetName, issueCount: issueRows.length, openIssuesCount: openIssues,
                    gatingIssuesCount: 0, missingDocs, status: openIssues > 0 ? 'Has Issues' : missingDocs.length > 0 ? 'Incomplete' : 'Complete',
                    allDocsSummary, issueDetails
                });
            } catch (e) { logTerminal(`Parsing fault: ${e.message}`, 'error'); }
        }

        res.innerHTML = html || '<span style="color:#999;font-size:12px;">No documentation data found.</span>';
        document.getElementById('fg-advanced-filters').style.display = 'block';

        // Populate Type filter dropdown
        const typeSel = document.getElementById('fg-filter-type');
        typeSel.innerHTML = '<option value="All">All Types</option>' +
            [...foundTypes].sort().map(t => `<option value="${escapeAttr(t)}">${escapeHtml(t)}</option>`).join('');

        // Wire up doc checkboxes & checklist controls
        document.querySelectorAll('.fg-doc').forEach(cb => cb.addEventListener('change', updateCounter));
        document.querySelectorAll('.fg-asset-expand-checklists').forEach(btn => {
            btn.onclick = ev => { ev.preventDefault(); ev.stopPropagation(); btn.closest('.fg-asset-group').querySelectorAll('.fg-checklist-group').forEach(g => g.open = true); };
        });
        document.querySelectorAll('.fg-asset-collapse-checklists').forEach(btn => {
            btn.onclick = ev => { ev.preventDefault(); ev.stopPropagation(); btn.closest('.fg-asset-group').querySelectorAll('.fg-checklist-group').forEach(g => g.open = false); };
        });
        document.querySelectorAll('.fg-checklist-status-controls').forEach(c => c.onclick = ev => ev.stopPropagation());
        document.querySelectorAll('.fg-checklist-status-select').forEach(sel => {
            sel.onfocus = ev => ev.stopPropagation();
        });
        document.querySelectorAll('.fg-checklist-status-submit').forEach(btn => {
            btn.onclick = async ev => {
                ev.preventDefault(); ev.stopPropagation();
                const sel = btn.parentElement.querySelector('.fg-checklist-status-select');
                if (!sel) return;
                btn.disabled = true; btn.textContent = 'Saving...';
                try { await submitChecklistStatus(sel, btn); }
                catch (e) { btn.textContent = 'Submit Status'; logTerminal(`Checklist update failed: ${e.message}`, 'error'); alert(e.message); }
                finally { btn.disabled = false; }
            };
        });

        updateCounter();
        logTerminal('Audit execution finished.', 'success');
        renderDashboardAndCards('All Assets');

        // Kick off background questionnaire loads (inline, per-checklist)
        if (questionnaireJobs.length) {
            logTerminal(`Background questionnaire load starting for ${questionnaireJobs.length} checklist(s)…`, 'info');
            startQuestionnaireLoads(questionnaireJobs, questionnaireGeneration);
        }

        // Background enrichment (discipline + notes)
        enrichDocumentsInBackground(prj);
    }

    /* ================================================================
     *  DRAG
     * ================================================================ */
    let dragging = false, oX = 0, oY = 0;
    document.addEventListener('mousedown', e => {
        const p = document.getElementById('fg-panel');
        const h = document.getElementById('fg-header');
        if (!p || !h || isMaximized) return;
        if (!h.contains(e.target) || e.target.tagName === 'BUTTON') return;
        dragging = true;
        const r = p.getBoundingClientRect();
        oX = e.clientX - r.left; oY = e.clientY - r.top;
        e.preventDefault();
    });
    document.addEventListener('mousemove', e => {
        const p = document.getElementById('fg-panel');
        if (!dragging || !p || isMaximized) return;
        p.style.left = Math.min(Math.max(0, e.clientX - oX), window.innerWidth - p.offsetWidth) + 'px';
        p.style.top  = Math.min(Math.max(0, e.clientY - oY), window.innerHeight - 50) + 'px';
        p.style.right = 'auto';
    });
    document.addEventListener('mouseup', () => { dragging = false; });

    /* ================================================================
     *  BOOT — runs once per URL change, no double-fire
     * ================================================================ */
    installTokenInterceptor();
    let _lastUrl = '';

    function initFrameworkExecution() {
        const url = window.location.href;
        if (url === _lastUrl) return;          // same URL → skip
        _lastUrl = url;

        const isEqs = url.includes('shp=eqs') || url.includes('action=eq_list');
        if (!url.includes('/inquire/') || !isEqs) {
            closeDocumentBufferDialog();
            const p = document.getElementById('fg-panel');
            if (p) p.remove();
            return;
        }
        if (!document.getElementById('fg-panel')) createPanel();
    }

    // Fire on load
    initFrameworkExecution();
    // Fire on SPA navigation (FG uses pushState)
    const _origPush = history.pushState.bind(history);
    history.pushState = function () { _origPush.apply(this, arguments); setTimeout(initFrameworkExecution, 600); };
    window.addEventListener('popstate', () => setTimeout(initFrameworkExecution, 600));
    // Fallback poll — only if URL changes
    setInterval(initFrameworkExecution, 1500);
})();
