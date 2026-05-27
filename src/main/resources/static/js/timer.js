/**
 * 학습 타이머 - 페이지 이동을 가로질러 동작하는 글로벌 타이머.
 */
const StudyTimer = (function() {
    const KEY_ELAPSED = 'studyTimer.elapsed';
    const KEY_STARTED_AT = 'studyTimer.startedAt';
    const KEY_RUNNING = 'studyTimer.running';

    let tickHandle = null;
    let displayEl = null;
    let toggleBtnEl = null;

    function getElapsed() {
        return parseInt(sessionStorage.getItem(KEY_ELAPSED) || '0', 10);
    }
    function setElapsed(sec) {
        sessionStorage.setItem(KEY_ELAPSED, String(sec));
    }
    function isRunning() {
        return sessionStorage.getItem(KEY_RUNNING) === 'true';
    }
    function getStartedAt() {
        const v = sessionStorage.getItem(KEY_STARTED_AT);
        return v ? parseInt(v, 10) : null;
    }

    function currentTotalSeconds() {
        const base = getElapsed();
        if (isRunning()) {
            const startedAt = getStartedAt();
            if (startedAt) {
                return base + Math.floor((Date.now() - startedAt) / 1000);
            }
        }
        return base;
    }

    function format(sec) {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        const pad = (n) => String(n).padStart(2, '0');
        if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
        return `${pad(m)}:${pad(s)}`;
    }

    function render() {
        if (!displayEl) return;
        displayEl.textContent = format(currentTotalSeconds());
        if (toggleBtnEl) {
            toggleBtnEl.textContent = isRunning() ? '⏸' : '▶';
            toggleBtnEl.title = isRunning() ? '일시정지' : '재개';
        }
    }

    function startTick() {
        if (tickHandle) return;
        tickHandle = setInterval(render, 1000);
    }
    function stopTick() {
        if (tickHandle) {
            clearInterval(tickHandle);
            tickHandle = null;
        }
    }

    function start() {
        if (isRunning()) return;
        sessionStorage.setItem(KEY_STARTED_AT, String(Date.now()));
        sessionStorage.setItem(KEY_RUNNING, 'true');
        startTick();
        render();
    }

    function pause() {
        if (!isRunning()) return;
        const startedAt = getStartedAt();
        if (startedAt) {
            const additional = Math.floor((Date.now() - startedAt) / 1000);
            setElapsed(getElapsed() + additional);
        }
        sessionStorage.setItem(KEY_RUNNING, 'false');
        sessionStorage.removeItem(KEY_STARTED_AT);
        stopTick();
        render();
    }

    function toggle() {
        isRunning() ? pause() : start();
    }

    function reset() {
        stopTick();
        sessionStorage.removeItem(KEY_ELAPSED);
        sessionStorage.removeItem(KEY_STARTED_AT);
        sessionStorage.removeItem(KEY_RUNNING);
        render();
    }

    function getSeconds() {
        return currentTotalSeconds();
    }

    function commitAndReset() {
        if (isRunning()) pause();
        const total = getElapsed();
        if (total <= 0) {
            reset();
            return Promise.resolve();
        }

        return fetch('/api/tracker/study-time', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ seconds: total })
        })
        .then(r => {
            if (!r.ok) throw new Error('학습 시간 저장 실패');
            reset();
        })
        .catch(e => {
            console.warn('[StudyTimer] commit failed:', e);
            reset();
        });
    }

    /**
     * 화면의 타이머 UI를 mount.
     * @param {boolean} autoResume - 학습 페이지에서 호출 시 true (이전에 running이었으면 자동 재개)
     */
    function mount(displayElement, toggleButton, autoResume) {
        displayEl = displayElement;
        toggleBtnEl = toggleButton;
        if (toggleBtnEl) {
            toggleBtnEl.addEventListener('click', toggle);
        }

        if (autoResume && isRunning()) {
            // 페이지 다시 진입했고 running 상태였으면 startedAt만 새로 설정
            sessionStorage.setItem(KEY_STARTED_AT, String(Date.now()));
            startTick();
        }

        render();
    }

    /**
     * 학습 탭을 떠날 때 호출 - 타이머가 돌아가고 있으면 일시정지.
     * 다음에 학습 탭으로 돌아왔을 때 mount(true) 호출 시 자동 재개됨.
     */
    function pauseOnLeave() {
        if (!isRunning()) return;
        const startedAt = getStartedAt();
        if (startedAt) {
            const additional = Math.floor((Date.now() - startedAt) / 1000);
            setElapsed(getElapsed() + additional);
        }
        // running 상태는 유지 (다른 탭에서는 안 보이지만, 학습 탭 돌아오면 자동 재개)
        sessionStorage.setItem(KEY_STARTED_AT, String(Date.now()));
        stopTick();
    }

    // beforeunload: 같은 페이지 안에서는 정확도 유지를 위해 시간 확정
    // 페이지 떠날 때: 흘러간 시간을 elapsed에 합치고 startedAt 제거.
    // running 상태는 유지하므로 학습 페이지 돌아왔을 때 mount(autoResume=true) 에서 자동 재개됨.
    window.addEventListener('beforeunload', () => {
        if (isRunning()) {
            const startedAt = getStartedAt();
            if (startedAt) {
                const additional = Math.floor((Date.now() - startedAt) / 1000);
                setElapsed(getElapsed() + additional);
            }
            sessionStorage.removeItem(KEY_STARTED_AT);
            stopTick();
        }
    });

    return {
        start, pause, toggle, reset, getSeconds, commitAndReset, mount,
        isRunning, pauseOnLeave,
    };
})();