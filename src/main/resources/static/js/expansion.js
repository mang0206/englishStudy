let selectedList = [];
let currentIdx = 0;

document.addEventListener('DOMContentLoaded', () => {
    selectedList = Session.get('selectedSentences') || [];
    if (selectedList.length === 0) {
        showToast('선택된 문장이 없습니다. 학습 화면으로 이동합니다.');
        setTimeout(() => location.href = '/study', 1200);
        return;
    }
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
    if (currentIdx >= selectedList.length) {
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
