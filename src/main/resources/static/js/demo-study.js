// demo-study.js
// study.js 기반. 영상/챕터 로딩은 실제 API, 번역·선택은 하드코딩.

let translatedSentences = [];
let mode = 'view';
let selectedSet = new Set();
let showEn = true, showKo = true;

let ytPlayer = null;
let ytPlayerReady = false;
let currentVideoId = null;
let loopEnabled = true;
let loopStart = 0;
let loopEnd = null;
let loopCheckInterval = null;

let currentChapters = [];
let selectedChapterIdx = -1;
let selectedChapterInfo = null;

// ─────────── 번역 (데모: 하드코딩) ───────────
function onTranslate() {
    const raw = document.getElementById('rawScript').value.trim();
    if (!raw) { showToast('스크립트를 입력해주세요'); return; }

    if (typeof StudyTimer !== 'undefined') StudyTimer.start();

    const btn = document.getElementById('btnTranslate');
    btn.disabled = true;
    btn.innerHTML = '<span class="loader"></span>번역 중...';

    // 실제 API 대신 가짜 비동기
    DEMO.translate()
        .then(data => {
            translatedSentences = data.sentences;
            renderScriptList();
            document.getElementById('stage-input').style.display = 'none';
            document.getElementById('stage-script').style.display = 'flex';

            const loadChapterBtn = document.getElementById('btnLoadChapter');
            if (loadChapterBtn) {
                loadChapterBtn.disabled = true;
                loadChapterBtn.textContent = '이미 학습 시작됨';
            }
        });
}

function renderScriptList() {
    const list = document.getElementById('scriptList');
    list.innerHTML = '';
    translatedSentences.forEach(s => {
        const isSelectMode = (mode === 'select');
        const isChecked = selectedSet.has(s.sentenceId);

        const div = document.createElement('div');
        // 데모: 선택 모드에서 미리 선택된 문장만 'locked' 표시, 나머진 흐리게
        div.className = 'script-block'
            + (isSelectMode ? ' checking' : '')
            + (isSelectMode && !isChecked ? ' demo-locked' : '');
        div.dataset.sentenceId = s.sentenceId;

        // 데모: onclick 제거 → 체크/해제 불가
        div.innerHTML = `
            <div class="check-mock${isChecked ? ' on' : ''}"></div>
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
        title.innerHTML = `문장 선택 <span class="notice">데모: 3문장 자동 선택됨</span>`;
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

// ─────────── 쉐도잉 완료 → 선택 모드 (데모: 3개 자동 체크) ───────────
function onShadowingComplete() {
    mode = 'select';
    selectedSet = new Set(DEMO.PRESELECTED_IDS);  // ★ 미리 3개 체크
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

// ─────────── 선택 완료 (데모: sessionStorage만, fetch 없음) ───────────
function onSelectComplete() {
    if (selectedSet.size < 3 || selectedSet.size > 5) {
        showToast('3~5개의 문장을 선택해주세요');
        return;
    }
    const selected = Array.from(selectedSet).map(id => {
        const s = translatedSentences.find(x => x.sentenceId === id);
        return { selectedId: id, englishText: s.english, koreanText: s.korean };
    });
    Session.set('selectedSentences', selected);
    Session.set('expansionResults', []);
    location.href = '/demo/study/expansion';
}

function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, c => ({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
}

// ─────────── YouTube IFrame API (study.js와 동일) ───────────
function initYoutubeApi() {
    if (window.YT && window.YT.Player) return;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
}
window.onYouTubeIframeAPIReady = function() { console.log('[YT API] ready'); };

function createOrReplacePlayer(videoId, startSec) {
    currentVideoId = videoId;
    const startInt = Math.floor(startSec || 0);
    if (ytPlayer && ytPlayerReady) {
        ytPlayer.loadVideoById({ videoId, startSeconds: startInt });
        return;
    }
    if (!window.YT || !window.YT.Player) {
        setTimeout(() => createOrReplacePlayer(videoId, startSec), 300);
        return;
    }
    ytPlayer = new YT.Player('ytPlayer', {
        videoId,
        playerVars: { start: startInt, modestbranding: 1, rel: 0 },
        events: {
            onReady: () => { ytPlayerReady = true; startLoopWatcher(); },
            onStateChange: (e) => {
                if (e.data === YT.PlayerState.ENDED && loopEnabled && loopEnd) {
                    ytPlayer.seekTo(loopStart, true);
                    ytPlayer.playVideo();
                }
            }
        }
    });
}

function startLoopWatcher() {
    if (loopCheckInterval) clearInterval(loopCheckInterval);
    loopCheckInterval = setInterval(() => {
        if (!ytPlayer || !ytPlayerReady) return;
        if (!loopEnabled || loopEnd == null) return;
        try {
            if (ytPlayer.getCurrentTime() >= loopEnd) ytPlayer.seekTo(loopStart, true);
        } catch (e) {}
    }, 300);
}

// ─────────── 비디오 + 챕터 로딩 (데모: 실제 API 호출) ───────────
function initYoutubeLoader() {
    const btn = document.getElementById('btnLoadVideo');
    const input = document.getElementById('ytUrl');
    const chapterBtn = document.getElementById('btnLoadChapter');
    if (!btn || !input || !chapterBtn) return;

    // 데모: URL 미리 채우고 변경 불가
    input.value = DEMO.VIDEO_URL;
    input.readOnly = true;

    btn.addEventListener('click', loadVideoAndChapters);
    chapterBtn.addEventListener('click', loadSelectedChapterTranscript);

    const loopBtn = document.getElementById('btnLoopToggle');
    const restartBtn = document.getElementById('btnRestart');
    const speedSelect = document.getElementById('speedSelect');
    if (loopBtn) loopBtn.addEventListener('click', toggleLoop);
    if (restartBtn) restartBtn.addEventListener('click', restartChapter);
    if (speedSelect) speedSelect.addEventListener('change', changeSpeed);
}

function loadVideoAndChapters() {
    const videoId = DEMO.VIDEO_ID;  // 데모: 고정

    createOrReplacePlayer(videoId, 0);

    const panel = document.getElementById('chapterPanel');
    const loading = document.getElementById('chapterLoading');
    const list = document.getElementById('chapterList');

    panel.style.display = 'none';
    loading.style.display = 'block';
    list.innerHTML = '';
    selectedChapterIdx = -1;
    loopEnd = null;

    // ★ 실제 API (분리된 데모 엔드포인트)
    fetch(DEMO.TRANSCRIPT_URL)
        .then(async r => {
            if (!r.ok) throw new Error(await handleApiError(r));
            return r.json();
        })
        .then(data => {
            currentChapters = data.chapters || [];
            renderChapters();
            loading.style.display = 'none';
            panel.style.display = 'flex';
        })
        .catch(e => {
            loading.style.display = 'none';
            showToast(e.message);
        });
}

// ─────────── 챕터 렌더 (데모: Job Interview만 활성) ───────────
function renderChapters() {
    const list = document.getElementById('chapterList');
    list.innerHTML = '';

    if (currentChapters.length === 0) {
        list.innerHTML = '<div class="empty-state">챕터를 찾을 수 없습니다.</div>';
        return;
    }

    currentChapters.forEach((ch, idx) => {
        const allowed = ch.title.trim() === DEMO.ALLOWED_CHAPTER_TITLE;  // ★

        const row = document.createElement('label');
        row.className = 'chapter-row';
        row.style.cssText = `
            display: flex; align-items: center; gap: 10px;
            padding: 8px 10px; border-radius: var(--radius);
            cursor: ${allowed ? 'pointer' : 'not-allowed'}; font-size: 13px;
            border: 0.5px solid var(--border);
            margin-bottom: 6px;
            opacity: ${allowed ? '1' : '0.4'};
        `;
        row.innerHTML = `
            <input type="radio" name="chapter" value="${idx}" ${allowed ? '' : 'disabled'} style="margin: 0;">
            <span style="flex:1;">${escapeHtml(ch.title)}</span>
            <span style="font-size: 11px; color: var(--text-muted);">
                ${formatTime(ch.startSec)}${ch.endSec ? ' ~ ' + formatTime(ch.endSec) : ''}
                ${allowed ? '' : ' · 데모 잠금'}
            </span>
        `;

        if (allowed) {
            row.querySelector('input').addEventListener('change', () => {
                selectedChapterIdx = idx;
                document.getElementById('btnLoadChapter').disabled = false;
                const startSec = Math.floor(ch.startSec);
                const endSec = ch.endSec ? Math.floor(ch.endSec) : null;
                loopStart = startSec;
                loopEnd = endSec;
                if (currentVideoId) createOrReplacePlayer(currentVideoId, startSec);
                updateLoopButton();
            });
        }
        list.appendChild(row);
    });
}

function formatTime(sec) {
    if (sec == null) return '';
    const s = Math.floor(sec);
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

// ─────────── 챕터 스크립트 불러오기 (실제 자막) ───────────
function loadSelectedChapterTranscript() {
    if (selectedChapterIdx < 0) { showToast('챕터를 선택해주세요'); return; }
    const ch = currentChapters[selectedChapterIdx];
    if (!ch.transcript || ch.transcript.trim() === '') {
        showToast('이 챕터에는 자막이 없습니다');
        return;
    }
    document.getElementById('rawScript').value = ch.transcript;
    selectedChapterInfo = { videoId: currentVideoId, chapterTitle: ch.title };
    showToast(`"${ch.title}" 챕터 자막 불러옴`);
}

// ─────────── 컨트롤 (study.js와 동일) ───────────
function toggleLoop() {
    loopEnabled = !loopEnabled;
    updateLoopButton();
    showToast(loopEnabled ? '구간 반복 ON' : '구간 반복 OFF');
}
function updateLoopButton() {
    const btn = document.getElementById('btnLoopToggle');
    if (!btn) return;
    if (loopEnabled && loopEnd != null) {
        btn.textContent = '🔁 반복 ON';
        btn.style.background = 'var(--accent)'; btn.style.color = 'white'; btn.style.borderColor = 'var(--accent)';
    } else if (!loopEnabled) {
        btn.textContent = '🔁 반복 OFF';
        btn.style.background = ''; btn.style.color = ''; btn.style.borderColor = '';
    } else {
        btn.textContent = '🔁 반복';
        btn.style.background = ''; btn.style.color = ''; btn.style.borderColor = '';
    }
}
function restartChapter() {
    if (!ytPlayer || !ytPlayerReady) { showToast('영상이 아직 준비되지 않았어요'); return; }
    ytPlayer.seekTo(loopStart, true);
    ytPlayer.playVideo();
}
function changeSpeed() {
    if (!ytPlayer || !ytPlayerReady) return;
    ytPlayer.setPlaybackRate(parseFloat(document.getElementById('speedSelect').value));
}

// ─────────── 초기화 (데모: 상태 복구 로직 제거) ───────────
initYoutubeApi();
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initYoutubeLoader);
} else {
    initYoutubeLoader();
}