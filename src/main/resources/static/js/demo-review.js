// demo-review.js
// review.js 기반. 목록/상세 모두 DEMO 하드코딩, 검색은 클라이언트 필터.

let searchTimer;
let openDetailId = null;

document.addEventListener('DOMContentLoaded', () => loadList(''));

function onSearchInput() {
    clearTimeout(searchTimer);
    const q = document.getElementById('searchInput').value.trim();
    searchTimer = setTimeout(() => loadList(q), 250);
}

function loadList(q) {
    DEMO.reviewList()
        .then(items => {
            const filtered = q
                ? items.filter(it => it.englishText.toLowerCase().includes(q.toLowerCase()))
                : items;
            render(filtered);
        })
        .catch(() => showToast('목록 로드 실패'));
}

function render(items) {
    const list = document.getElementById('reviewList');
    if (!items || items.length === 0) {
        list.innerHTML = '<div class="empty-state">검색 결과가 없습니다.</div>';
        return;
    }
    list.innerHTML = items.map(item => `
        <div class="review-row" onclick="toggleDetail(${item.selectedId})">
            <span class="review-date">${formatDate(item.studyDate)}</span>
            <span class="review-sentence">${escapeHtml(item.englishText)}</span>
            <span class="check-count">${'✅'.repeat(item.correctCount) || '–'}</span>
        </div>
        <div class="review-detail" id="detail-${item.selectedId}" style="display:none;"></div>
    `).join('');
}

function toggleDetail(id) {
    const wrap = document.getElementById('detail-' + id);
    if (!wrap) return;

    if (openDetailId === id) {
        wrap.style.display = 'none';
        openDetailId = null;
        return;
    }
    if (openDetailId) {
        const prev = document.getElementById('detail-' + openDetailId);
        if (prev) prev.style.display = 'none';
    }
    openDetailId = id;
    wrap.style.display = 'block';
    wrap.innerHTML = '<div class="empty-state"><span class="loader"></span>로딩 중...</div>';

    DEMO.reviewDetail(id)
        .then(data => {
            if (!data) {
                wrap.innerHTML = '<div class="empty-state">이 문장은 데모 상세 데이터가 없어요.</div>';
                return;
            }
            renderDetail(wrap, data);
        })
        .catch(() => { wrap.innerHTML = '<div class="empty-state">상세 로드 실패</div>'; });
}

function renderDetail(wrap, d) {
    const rows = d.expansions.map(e => {
        const isEmpty = !e.userInput;
        const inputCls = isEmpty ? 'rv-input-mock empty' : 'rv-input-mock';
        const inputText = isEmpty ? '미작성' : escapeHtml(e.userInput);

        const badge = e.correct
            ? '<span class="exp-badge ok">✅ 자연스러워요</span>'
            : '<span class="exp-badge fix">수정 필요</span>';

        const showFeedback = !e.correct;
        const fbText = isEmpty ? '작성하지 않았습니다' : escapeHtml(e.feedbackText || '');

        return `
            <div class="rv-exp-row">
                <div class="rv-exp-top">
                    <span class="exp-tag">${e.typeName}</span>
                    <span class="${inputCls}">${inputText}</span>
                    ${badge}
                </div>
                ${showFeedback && fbText ? `<div class="rv-feedback fix show">${fbText}</div>` : ''}
            </div>
        `;
    }).join('');

    wrap.innerHTML = `
        <div class="rv-title">원문: "${escapeHtml(d.englishText)}"</div>
        ${rows}
    `;
}

function formatDate(d) {
    if (!d) return '';
    const parts = String(d).split('-');
    return parts.length >= 3 ? `${parts[1]}/${parts[2]}` : d;
}

function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, c => ({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
}