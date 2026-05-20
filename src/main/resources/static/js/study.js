let translatedSentences = [];
let mode = 'view';
let selectedSet = new Set();
let showEn = true, showKo = true;

function onTranslate() {
    const raw = document.getElementById('rawScript').value.trim();
    if (!raw) { showToast('스크립트를 입력해주세요'); return; }

    const btn = document.getElementById('btnTranslate');
    btn.disabled = true;
    btn.innerHTML = '<span class="loader"></span>번역 중...';

    fetch('/api/script/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawScript: raw })
    })
    .then(async r => {
        if (!r.ok) throw new Error(await handleApiError(r));
        return r.json();
    })
    .then(data => {
        translatedSentences = data.sentences;
        renderScriptList();
        document.getElementById('stage-input').style.display = 'none';
        document.getElementById('stage-script').style.display = 'flex';
    })
    .catch(e => {
        showToast(e.message);
        btn.disabled = false;
        btn.textContent = '번역 시작';
    });
}

function renderScriptList() {
    const list = document.getElementById('scriptList');
    list.innerHTML = '';
    translatedSentences.forEach(s => {
        const div = document.createElement('div');
        div.className = 'script-block' + (mode === 'select' ? ' checking' : '');
        div.dataset.sentenceId = s.sentenceId;
        div.innerHTML = `
            <div class="check-mock${selectedSet.has(s.sentenceId) ? ' on' : ''}"
                 onclick="toggleCheck(${s.sentenceId})"></div>
            <div class="script-text">
                <div class="script-en${showEn ? '' : ' hidden'}">${escapeHtml(s.english)}</div>
                <div class="script-ko${showKo ? '' : ' hidden'}">${escapeHtml(s.korean)}</div>
            </div>
        `;
        list.appendChild(div);
    });
}

function toggleCheck(sentenceId) {
    if (mode !== 'select') return;
    if (selectedSet.has(sentenceId)) selectedSet.delete(sentenceId);
    else selectedSet.add(sentenceId);
    updatePaneTitle();
    renderScriptList();
}

function updatePaneTitle() {
    const title = document.getElementById('paneTitle');
    if (mode === 'select') {
        title.innerHTML = `문장 선택 (3~5개) <span class="notice">${selectedSet.size}개 선택됨</span>`;
    } else {
        title.textContent = '학습 스크립트';
    }
}

function toggleEn() {
    showEn = !showEn;
    document.getElementById('btnToggleEn').textContent = showEn ? 'EN 숨기기' : 'EN 보기';
    renderScriptList();
}
function toggleKo() {
    showKo = !showKo;
    document.getElementById('btnToggleKo').textContent = showKo ? 'KO 숨기기' : 'KO 보기';
    renderScriptList();
}

function onShadowingComplete() {
    mode = 'select';
    selectedSet.clear();
    updatePaneTitle();
    renderScriptList();
    document.getElementById('scriptFooter').innerHTML = `
        <button class="btn danger" onclick="onCancelSelect()">취소</button>
        <button class="btn primary" onclick="onSelectComplete()">선택 완료 →</button>
    `;
}

function onCancelSelect() {
    mode = 'view';
    selectedSet.clear();
    updatePaneTitle();
    renderScriptList();
    document.getElementById('scriptFooter').innerHTML = `
        <button class="btn primary" onclick="onShadowingComplete()">쉐도잉 완료</button>
    `;
}

function onSelectComplete() {
    if (selectedSet.size < 3 || selectedSet.size > 5) {
        showToast('3~5개의 문장을 선택해주세요');
        return;
    }

    const ids = Array.from(selectedSet);
    fetch('/api/sentence/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentenceIds: ids })
    })
    .then(async r => {
        if (!r.ok) throw new Error(await handleApiError(r));
        return r.json();
    })
    .then(data => {
        Session.set('selectedSentences', data.selected);
        Session.set('expansionResults', []);
        location.href = '/study/expansion';
    })
    .catch(e => showToast(e.message));
}

function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, c => ({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
}
