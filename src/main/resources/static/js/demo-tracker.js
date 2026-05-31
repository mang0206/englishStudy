// demo-tracker.js
// 서버 fetch 없이 DEMO.TRACKER_WEEK로 통계/블록/주간 캘린더를 그린다.
// 태스크 토글은 화면 상태만 변경 (서버 저장 X).

document.addEventListener('DOMContentLoaded', () => {
    renderTracker(DEMO.TRACKER_WEEK);
});

function renderTracker(week) {
    // 1. 상단 진행 바 + 통계
    const pct = week.totalTasks ? Math.round(week.completedTasks / week.totalTasks * 100) : 0;
    document.querySelector('.progress-bar').style.width = pct + '%';
    document.getElementById('statDone').textContent = `${week.completedTasks} / ${week.totalTasks}`;
    document.getElementById('statTime').textContent = week.studyTimeLabel;
    document.getElementById('statStreak').textContent = week.streakDays + '일';

    // 2. 블록 목록
    const blocksWrap = document.getElementById('blocks');
    blocksWrap.innerHTML = week.blocks.map(b => `
        <div class="block" id="block-${b.block}">
            <div class="block-header" onclick="toggleBlock('${b.block}')">
                <div class="block-icon">${b.icon}</div>
                <div class="block-meta">
                    <div class="block-title">${escapeHtml(b.displayName)}</div>
                    <div class="block-time">${escapeHtml(b.timeLabel)}</div>
                </div>
                <div class="block-prog">
                    <div class="mini-bar-wrap">
                        <div class="mini-bar" style="width:${b.progressPercent}%"></div>
                    </div>
                    <span class="block-prog-text">${b.completedTasks}/${b.totalTasks}</span>
                </div>
                <span class="chevron" id="chev-${b.block}">▼</span>
            </div>
            <div class="block-body" id="body-${b.block}">
                ${renderTasks(b)}
            </div>
        </div>
    `).join('');

    // 3. 주간 캘린더
    const grid = document.getElementById('weekGrid');
    grid.innerHTML = week.weekDays.map(wd => {
        const cls = {
            'today': 'today',
            'done-full': 'done-full',
            'done-partial': 'done-partial',
            'future': 'future',
        }[wd.state] || 'past';
        return `<div class="day-cell ${cls}">${wd.dayName}</div>`;
    }).join('');
}

// 태스크 라벨은 StudyBlock별 TaskDefinition을 데모에도 복제해둔다 (DEMO.TASK_LABELS)
function renderTasks(b) {
    const labels = (DEMO.TASK_LABELS && DEMO.TASK_LABELS[b.block]) || [];
    const rows = labels.map((label, i) => {
        const done = i < b.completedTasks;  // 앞쪽부터 완료 처리
        return `
            <div class="task" onclick="toggleDemoTask('${b.block}', ${i})">
                <div class="task-check ${done ? 'done' : ''}" id="dcheck-${b.block}-${i}"></div>
                <span class="task-label ${done ? 'done' : ''}" id="dlabel-${b.block}-${i}">${escapeHtml(label)}</span>
            </div>
        `;
    }).join('');
    return `${rows}
        <div class="note-area">
            <div class="note-label">오늘의 메모</div>
            <textarea class="note-input" placeholder="데모에서는 저장되지 않아요"></textarea>
        </div>`;
}

function toggleBlock(blockName) {
    const body = document.getElementById('body-' + blockName);
    const chev = document.getElementById('chev-' + blockName);
    if (!body) return;
    body.classList.toggle('open');
    chev.classList.toggle('open');
}

// 데모: 체크 토글은 화면만 (서버 저장 없음)
function toggleDemoTask(blockName, idx) {
    const check = document.getElementById(`dcheck-${blockName}-${idx}`);
    const label = document.getElementById(`dlabel-${blockName}-${idx}`);
    check.classList.toggle('done');
    label.classList.toggle('done');
    showToast('데모에서는 저장되지 않아요');
}

function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, c => ({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
}