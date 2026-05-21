function toggleBlock(blockName) {
    const body = document.getElementById('body-' + blockName);
    const chev = document.getElementById('chev-' + blockName);
    if (!body) return;
    body.classList.toggle('open');
    chev.classList.toggle('open');
}

function toggleTask(date, blockName, taskIndex) {
    fetch('/api/task/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ date, block: blockName, taskIndex })
    })
    .then(r => r.json())
    .then(data => {
        const check = document.getElementById(`check-${blockName}-${taskIndex}`);
        const label = document.getElementById(`label-${blockName}-${taskIndex}`);
        const isChecked = data.taskChecks[taskIndex];
        check.classList.toggle('done', isChecked);
        label.classList.toggle('done', isChecked);

        const miniBar = document.getElementById('miniBar-' + blockName);
        const blockProg = document.getElementById('blockProg-' + blockName);
        if (miniBar) miniBar.style.width = data.blockPercent + '%';
        if (blockProg) blockProg.textContent = data.blockDone + '/' + data.blockTotal;

        const mainBar = document.querySelector('.progress-bar');
        if (mainBar) mainBar.style.width = data.totalPercent + '%';

        const statDone = document.getElementById('statDone');
        if (statDone) statDone.textContent = data.totalDone + ' / ' + data.totalTasks;
    })
    .catch(() => showToast('저장 실패'));
}

function saveMemo(date, blockName, memo) {
    fetch('/api/memo/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ date, block: blockName, memo })
    })
    .then(r => { if (r.ok) showToast('메모 저장됨'); })
    .catch(() => showToast('저장 실패'));
}

function resetDay(date) {
    if (!confirm('오늘 기록을 모두 초기화할까요?')) return;
    fetch('/api/day/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ date })
    })
    .then(r => { if (r.ok) location.reload(); })
    .catch(() => showToast('초기화 실패'));
}


document.addEventListener('DOMContentLoaded', () => {
    // 클릭 이벤트
     document.body.addEventListener('click', (e) => {
         const target = e.target.closest('[data-action]');
         if (!target) return;

         const action = target.dataset.action;

         if (action === 'reset') {
             resetDay(target.dataset.date);
         } else if (action === 'toggle-block') {
             toggleBlock(target.dataset.block);
         } else if (action === 'toggle-task') {
             toggleTask(target.dataset.date, target.dataset.block, parseInt(target.dataset.taskIndex, 10));
         }
     });

     // textarea blur 이벤트 (blur는 버블링 안 돼서 capture phase로 잡음)
     document.body.addEventListener('blur', (e) => {
         const target = e.target.closest('[data-action="save-memo"]');
         if (!target) return;
         saveMemo(target.dataset.date, target.dataset.block, target.value);
     }, true);
 });