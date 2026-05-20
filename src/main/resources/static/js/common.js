let _toastTimer;
function showToast(msg) {
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}

const Session = {
    set(key, val) { sessionStorage.setItem(key, JSON.stringify(val)); },
    get(key) { try { return JSON.parse(sessionStorage.getItem(key)); } catch { return null; } },
    clear(key) { sessionStorage.removeItem(key); }
};

// 글로벌 예외 응답 파싱
async function handleApiError(response) {
    try {
        const err = await response.json();
        return err.message || '요청 처리 실패';
    } catch {
        return `서버 오류 (${response.status})`;
    }
}
