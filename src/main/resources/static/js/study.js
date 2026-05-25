// 화면 상태
let translatedSentences = [];
let mode = 'view';
let selectedSet = new Set();
let showEn = true, showKo = true;

// YouTube Player 상태
let ytPlayer = null;
let ytPlayerReady = false;
let currentVideoId = null;
let loopEnabled = true;
let loopStart = 0;
let loopEnd = null;
let loopCheckInterval = null;

let currentChapters = [];
let selectedChapterIdx = -1;

// ─────────────────────────── 번역 ───────────────────────────
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

        // 번역 완료 후 챕터 불러오기 버튼 비활성화
        const loadChapterBtn = document.getElementById('btnLoadChapter');
        if (loadChapterBtn) {
            loadChapterBtn.disabled = true;
            loadChapterBtn.textContent = '이미 학습 시작됨';
        }
    })
    .catch(e => {
        showToast(e.message);
        btn.disabled = false;
        btn.textContent = '번역 시작';
    });
}

// ─────────────────────────── 학습 스크립트 ───────────────────────────
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

// ─────────────────────────── YouTube IFrame Player API ───────────────────────────
function initYoutubeApi() {
    if (window.YT && window.YT.Player) return;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
}

window.onYouTubeIframeAPIReady = function() {
    console.log('[YT API] ready');
};

function createOrReplacePlayer(videoId, startSec) {
    currentVideoId = videoId;
    const startInt = Math.floor(startSec || 0);

    if (ytPlayer && ytPlayerReady) {
        // 이미 player 있으면 video만 교체
        ytPlayer.loadVideoById({
            videoId: videoId,
            startSeconds: startInt,
        });
        return;
    }

    // 처음 생성
    if (!window.YT || !window.YT.Player) {
        // API 아직 로딩 중 → 잠시 후 재시도
        setTimeout(() => createOrReplacePlayer(videoId, startSec), 300);
        return;
    }

    ytPlayer = new YT.Player('ytPlayer', {
        videoId: videoId,
        playerVars: {
            start: startInt,
            modestbranding: 1,
            rel: 0,
        },
        events: {
            onReady: () => {
                ytPlayerReady = true;
                startLoopWatcher();
            },
            onStateChange: (e) => {
                // 끝까지 재생됐을 때 반복 모드면 다시 시작
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
            const t = ytPlayer.getCurrentTime();
            if (t >= loopEnd) {
                ytPlayer.seekTo(loopStart, true);
            }
        } catch (e) { /* ignore */ }
    }, 300);
}

// ─────────────────────────── 비디오 로드 + 챕터 ───────────────────────────
function initYoutubeLoader() {
    const btn = document.getElementById('btnLoadVideo');
    const input = document.getElementById('ytUrl');
    const chapterBtn = document.getElementById('btnLoadChapter');
    if (!btn || !input || !chapterBtn) return;

    btn.addEventListener('click', loadVideoAndChapters);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') loadVideoAndChapters();
    });
    chapterBtn.addEventListener('click', loadSelectedChapterTranscript);

    // 컨트롤 버튼 바인딩
    const loopBtn = document.getElementById('btnLoopToggle');
    const restartBtn = document.getElementById('btnRestart');
    const speedSelect = document.getElementById('speedSelect');
    if (loopBtn) loopBtn.addEventListener('click', toggleLoop);
    if (restartBtn) restartBtn.addEventListener('click', restartChapter);
    if (speedSelect) speedSelect.addEventListener('change', changeSpeed);
}

function extractVideoId(url) {
    const patterns = [
        /[?&]v=([^&]+)/,
        /youtu\.be\/([^?&]+)/,
        /youtube\.com\/embed\/([^?&]+)/
    ];
    for (const p of patterns) {
        const m = url.match(p);
        if (m) return m[1];
    }
    return null;
}

function loadVideoAndChapters() {
    const url = document.getElementById('ytUrl').value.trim();
    const videoId = extractVideoId(url);
    if (!videoId) {
        showToast('유효한 YouTube URL이 아닙니다');
        return;
    }

    // 영상 embed (Player API로)
    createOrReplacePlayer(videoId, 0);

    // 챕터 정보 가져오기
    const panel = document.getElementById('chapterPanel');
    const loading = document.getElementById('chapterLoading');
    const list = document.getElementById('chapterList');

    panel.style.display = 'none';
    loading.style.display = 'block';
    list.innerHTML = '';
    selectedChapterIdx = -1;
    loopEnd = null;  // 구간 반복 해제

    fetch(`/api/transcript/${encodeURIComponent(videoId)}`)
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

function renderChapters() {
    const list = document.getElementById('chapterList');
    list.innerHTML = '';

    if (currentChapters.length === 0) {
        list.innerHTML = '<div class="empty-state">챕터를 찾을 수 없습니다.</div>';
        return;
    }

    currentChapters.forEach((ch, idx) => {
        const row = document.createElement('label');
        row.className = 'chapter-row';
        row.style.cssText = `
            display: flex; align-items: center; gap: 10px;
            padding: 8px 10px; border-radius: var(--radius);
            cursor: pointer; font-size: 13px;
            border: 0.5px solid var(--border);
            margin-bottom: 6px;
        `;
        row.innerHTML = `
            <input type="radio" name="chapter" value="${idx}" style="margin: 0;">
            <span style="flex:1;">${escapeHtml(ch.title)}</span>
            <span style="font-size: 11px; color: var(--text-muted);">
                ${formatTime(ch.startSec)}${ch.endSec ? ' ~ ' + formatTime(ch.endSec) : ''}
            </span>
        `;
        row.querySelector('input').addEventListener('change', () => {
            selectedChapterIdx = idx;
            document.getElementById('btnLoadChapter').disabled = false;

            // 영상도 해당 챕터 시작 시간으로 이동 + 구간 반복 설정
            const startSec = Math.floor(ch.startSec);
            const endSec = ch.endSec ? Math.floor(ch.endSec) : null;
            loopStart = startSec;
            loopEnd = endSec;

            if (currentVideoId) {
                createOrReplacePlayer(currentVideoId, startSec);
            }
            updateLoopButton();
        });
        list.appendChild(row);
    });
}

function formatTime(sec) {
    if (sec == null) return '';
    const s = Math.floor(sec);
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem.toString().padStart(2, '0')}`;
}

function loadSelectedChapterTranscript() {
    if (selectedChapterIdx < 0) {
        showToast('챕터를 선택해주세요');
        return;
    }
    const ch = currentChapters[selectedChapterIdx];
    if (!ch.transcript || ch.transcript.trim() === '') {
        showToast('이 챕터에는 자막이 없습니다');
        return;
    }
    document.getElementById('rawScript').value = ch.transcript;
    showToast(`"${ch.title}" 챕터 자막 불러옴`);
}

// ─────────────────────────── 컨트롤: 반복/속도/처음으로 ───────────────────────────
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
        btn.style.background = 'var(--accent)';
        btn.style.color = 'white';
        btn.style.borderColor = 'var(--accent)';
    } else if (!loopEnabled) {
        btn.textContent = '🔁 반복 OFF';
        btn.style.background = '';
        btn.style.color = '';
        btn.style.borderColor = '';
    } else {
        btn.textContent = '🔁 반복';
        btn.style.background = '';
        btn.style.color = '';
        btn.style.borderColor = '';
    }
}

function restartChapter() {
    if (!ytPlayer || !ytPlayerReady) {
        showToast('영상이 아직 준비되지 않았어요');
        return;
    }
    ytPlayer.seekTo(loopStart, true);
    ytPlayer.playVideo();
}

function changeSpeed() {
    if (!ytPlayer || !ytPlayerReady) return;
    const select = document.getElementById('speedSelect');
    const rate = parseFloat(select.value);
    ytPlayer.setPlaybackRate(rate);
}

// ─────────────────────────── 초기화 ───────────────────────────
initYoutubeApi();
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initYoutubeLoader);
} else {
    initYoutubeLoader();
}