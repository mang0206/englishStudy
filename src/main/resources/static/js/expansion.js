let selectedList = [];
let currentIdx = parseInt(sessionStorage.getItem('expansion.currentIdx') || '0', 10)

document.addEventListener('DOMContentLoaded', () => {
    selectedList = Session.get('selectedSentences') || [];
    if (selectedList.length === 0) {
        showToast('선택된 문장이 없습니다. 학습 화면으로 이동합니다.');
        setTimeout(() => location.href = '/study', 1200);
        return;
    }
    // 범위 벗어난 인덱스 방어
    if (currentIdx >= selectedList.length) currentIdx = 0;
    renderCurrent();
});

function renderCurrent() {
    const cur = selectedList[currentIdx];
    document.getElementById('expProgress').textContent = `문장 ${currentIdx + 1} / ${selectedList.length}`;
    document.getElementById('expSentence').textContent = `원문: "${cur.englishText}"`;

    document.querySelectorAll('.exp-row').forEach(row => {
        row.querySelector('.exp-input').value = '';
        const fb = row.querySelector('.exp-feedback');
        fb.style.display = 'none';
        fb.innerHTML = '';
    });

    document.getElementById('btnFeedback').style.display = '';
    document.getElementById('btnNext').style.display = 'none';

    // 현재 문장에 대해 sessionStorage에 임시 저장된 상태가 있으면 복구
    const raw = sessionStorage.getItem('expansion.current');
    if (raw) {
        try {
            const cached = JSON.parse(raw);
            if (cached.idx === currentIdx) {
                // 입력값 복구
                if (cached.inputs) {
                    document.querySelectorAll('.exp-row').forEach(row => {
                        const type = row.dataset.type;
                        const val = cached.inputs[type];
                        if (val) row.querySelector('.exp-input').value = val;
                    });
                }
                // 피드백 결과 복구 (있으면)
                if (cached.results && cached.results.length > 0) {
                    renderFeedback(cached.results);
                    document.getElementById('btnFeedback').style.display = 'none';
                    document.getElementById('btnNext').style.display = '';
                }
            } else {
                // 다른 문장의 임시 저장은 비움
                sessionStorage.removeItem('expansion.current');
            }
        } catch (e) {
            console.warn('[expansion] cached state parse failed:', e);
            sessionStorage.removeItem('expansion.current');
        }
    }
}

function onFeedback() {
    const cur = selectedList[currentIdx];
    const expansions = {};
    document.querySelectorAll('.exp-row').forEach(row => {
        const type = row.dataset.type;
        const val = row.querySelector('.exp-input').value.trim();
        expansions[type] = val;
    });

    const btn = document.getElementById('btnFeedback');
    btn.disabled = true;
    btn.innerHTML = '<span class="loader"></span>피드백 받는 중...';

    fetch('/api/expansion/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            selectedSentenceId: cur.selectedId,
            expansions: expansions
        })
    })
    .then(async r => {
        if (!r.ok) throw new Error(await handleApiError(r));
        return r.json();
    })
    .then(data => {
        renderFeedback(data.results);

        const all = Session.get('expansionResults') || [];
        all.push({
            selectedId: cur.selectedId,
            englishText: cur.englishText,
            results: data.results
        });
        Session.set('expansionResults', all);

        // 현재 문장의 입력값 + 피드백 결과를 sessionStorage에 임시 저장
        // (다른 탭 다녀와도 복구되도록)
        sessionStorage.setItem('expansion.current', JSON.stringify({
            idx: currentIdx,
            inputs: expansions,
            results: data.results,
        }));

        btn.style.display = 'none';
        btn.disabled = false;
        btn.textContent = '피드백 받기';
        document.getElementById('btnNext').style.display = '';
    })
    .catch(e => {
        showToast(e.message);
        btn.disabled = false;
        btn.textContent = '피드백 받기';
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
    sessionStorage.setItem('expansion.currentIdx', String(currentIdx));
    sessionStorage.removeItem('expansion.current');  // 다음 문장으로 넘어가니 임시 저장 정리

    if (currentIdx >= selectedList.length) {
        sessionStorage.removeItem('expansion.currentIdx');
        location.href = '/study/prompt';
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

// ─────────────────────────── 한영 사전 ───────────────────────────
function initDictionary() {
    const input = document.getElementById('dictInput');
    const btn = document.getElementById('dictBtn');
    if (!input || !btn) return;

    btn.addEventListener('click', searchDictionary);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') searchDictionary();
    });
}

function searchDictionary() {
    const q = document.getElementById('dictInput').value.trim();
    if (!q) {
        showToast('검색할 단어를 입력해주세요');
        return;
    }

    const result = document.getElementById('dictResult');
    result.innerHTML = '<div class="dict-empty"><span class="loader"></span>검색 중...</div>';

    fetch(`/api/dictionary?q=${encodeURIComponent(q)}`)
        .then(async r => {
            if (!r.ok) throw new Error(await handleApiError(r));
            return r.json();
        })
        .then(data => {
            renderDictResult(data);
        })
        .catch(e => {
            result.innerHTML = `<div class="dict-empty" style="color: var(--warn);">검색 실패: ${escapeHtml(e.message)}</div>`;
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

// expansion.js 초기화 흐름에 추가
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDictionary);
} else {
    initDictionary();
}

// ─────────────────────────── 학습 단계 표시 ───────────────────────────
// 확장 페이지에 들어왔다는 것 자체를 sessionStorage에 기록.
// 다른 탭 갔다가 학습 탭으로 돌아왔을 때 이 페이지로 자동 복귀하기 위함.
(function markExpansionStage() {
    const raw = sessionStorage.getItem('studyState');
    const state = raw ? JSON.parse(raw) : {};
    state.stage = 'EXPANSION';
    sessionStorage.setItem('studyState', JSON.stringify(state));
})();
