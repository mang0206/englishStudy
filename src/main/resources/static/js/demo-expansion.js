// demo-expansion.js
// expansion.js 기반. 피드백·사전 모두 DEMO 하드코딩.

let selectedList = [];
let currentIdx = 0;

document.addEventListener('DOMContentLoaded', () => {
    selectedList = Session.get('selectedSentences') || [];
    if (selectedList.length === 0) {
        showToast('선택된 문장이 없습니다. 데모 학습 화면으로 이동합니다.');
        setTimeout(() => location.href = '/demo/study', 1200);
        return;
    }
    renderCurrent();
});

function renderCurrent() {
    const cur = selectedList[currentIdx];
    document.getElementById('expProgress').textContent = `문장 ${currentIdx + 1} / ${selectedList.length}`;
    document.getElementById('expSentence').textContent = `원문: "${cur.englishText}"`;

    // 데모: 입력칸을 미리 채워둔다 (DEMO.EXPANSION[selectedId].inputs)
    const preset = (DEMO.EXPANSION[cur.selectedId] || {}).inputs || {};
    document.querySelectorAll('.exp-row').forEach(row => {
        const type = row.dataset.type;
        row.querySelector('.exp-input').value = preset[type] || '';
        const fb = row.querySelector('.exp-feedback');
        fb.style.display = 'none';
        fb.innerHTML = '';
    });

    document.getElementById('btnFeedback').style.display = '';
    document.getElementById('btnNext').style.display = 'none';
}

function onFeedback() {
    const cur = selectedList[currentIdx];

    const btn = document.getElementById('btnFeedback');
    btn.disabled = true;
    btn.innerHTML = '<span class="loader"></span>피드백 받는 중...';

    // 데모: 하드코딩 피드백
    DEMO.feedback(cur.selectedId)
        .then(data => {
            renderFeedback(data.results);

            const all = Session.get('expansionResults') || [];
            all.push({
                selectedId: cur.selectedId,
                englishText: cur.englishText,
                results: data.results
            });
            Session.set('expansionResults', all);

            btn.style.display = 'none';
            btn.disabled = false;
            btn.textContent = '피드백 받기';
            document.getElementById('btnNext').style.display = '';
        });
}

function renderFeedback(results) {
    document.querySelectorAll('.exp-row').forEach(row => {
        const type = row.dataset.type;
        const r = results.find(x => x.type === type);
        const fb = row.querySelector('.exp-feedback');
        if (!r) { fb.style.display = 'none'; return; }
        fb.style.display = 'block';
        fb.className = 'exp-feedback ' + (r.correct ? 'ok' : 'fix');
        const badge = r.correct
            ? `<span class="exp-badge ok">✅ 자연스러워요</span>`
            : `<span class="exp-badge fix">수정 필요</span>`;
        fb.innerHTML = badge + escapeHtml(r.feedback);
    });
}

function onNext() {
    currentIdx++;
    if (currentIdx >= selectedList.length) {
        location.href = '/demo/study/prompt';
    } else {
        renderCurrent();
    }
}

function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, c => ({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
}

// ─────────── 한영 사전 (데모: DEMO.dictionary) ───────────
function initDictionary() {
    const input = document.getElementById('dictInput');
    const btn = document.getElementById('dictBtn');
    if (!input || !btn) return;
    btn.addEventListener('click', searchDictionary);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') searchDictionary(); });
}

function searchDictionary() {
    const q = document.getElementById('dictInput').value.trim();
    if (!q) { showToast('검색할 단어를 입력해주세요'); return; }

    const result = document.getElementById('dictResult');
    result.innerHTML = '<div class="dict-empty"><span class="loader"></span>검색 중...</div>';

    DEMO.dictionary(q).then(data => {
        if (!data.translations || data.translations.length === 0) {
            const keys = Object.keys(DEMO.DICTIONARY).map(k => `"${k}"`).join(', ');
            result.innerHTML = `<div class="dict-empty">데모에서는 ${keys} 만 검색할 수 있어요.</div>`;
            return;
        }
        renderDictResult(data);
    });
}

function renderDictResult(data) {
    const result = document.getElementById('dictResult');
    const items = (data.translations || []).map(t => `
        <div class="dict-translation-item">
            <div class="dict-en-row">
                <span class="dict-en">${escapeHtml(t.english)}</span>
                ${t.pos ? `<span class="dict-pos">${escapeHtml(t.pos)}</span>` : ''}
            </div>
            <div class="dict-nuance">${escapeHtml(t.nuance || '')}</div>
            ${t.example ? `
                <div class="dict-example-inline">
                    <div class="dict-example-en-inline">${escapeHtml(t.example)}</div>
                    <div class="dict-example-ko-inline">${escapeHtml(t.exampleKorean || '')}</div>
                </div>
            ` : ''}
        </div>
    `).join('');

    result.innerHTML = `
        <div class="dict-query">"${escapeHtml(data.query)}"</div>
        ${items}
    `;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDictionary);
} else {
    initDictionary();
}