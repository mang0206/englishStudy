document.addEventListener('DOMContentLoaded', () => {
    const results = Session.get('expansionResults') || [];
    const expressions = results.map(r => `"${r.englishText}"`).join(', ');

    const part1 = `너는 내 영어 회화 파트너야.
나는 6개월 어학연수를 준비 중인 한국인 개발자야.
현재 수준: 문법 조금 아는 수준이고 말하는 게 어려워.

오늘 배운 표현: ${expressions || '(아직 없음)'}

규칙:
1. 이 주제로 나랑 자연스럽게 대화해줘: [일상/회사/개발 중 선택]
2. 내가 말할 때마다 어색한 표현은 이렇게 교정해줘 → [더 자연스러운 표현: ...]
3. 내가 오늘 배운 표현을 아직 안 썼으면 부드럽게 유도해줘
4. 네 답변은 짧게 (2~3문장) 유지해서 내가 말할 기회를 많이 갖게 해줘
5. 어떤 상황에서도 한국어로 바꾸지 마`;

    const part2 = `너는 내 영어 회화 파트너야.
나는 6개월 어학연수를 준비 중인 한국인 개발자야.
현재 수준: 문법 조금 아는 수준이고 말하는 게 어려워.

규칙:
1. 일상, 기술, 여행, 의견 등 자유롭게 대화해줘
2. 내가 말할 때마다 어색한 표현은 이렇게 교정해줘 → [더 자연스러운 표현: ...]
3. 내가 막혀서 한국말로 물어보면 그에 맞는 표현 알려줘
4. 10분마다 내가 반복하는 실수를 짧게 정리해줘
5. 네 답변은 짧게 (2~3문장) 유지해서 내가 말할 기회를 많이 갖게 해줘
6. 마지막에 짧은 피드백 요약해줘: 잘한 점이랑 다음에 집중할 부분`;

    document.getElementById('part1').textContent = part1;
    document.getElementById('part2').textContent = part2;

    Session.clear('selectedSentences');
    Session.clear('expansionResults');
});

function copyPrompt(id) {
    const text = document.getElementById(id).textContent;
    navigator.clipboard.writeText(text)
        .then(() => showToast('복사되었습니다'))
        .catch(() => showToast('복사 실패'));
}
