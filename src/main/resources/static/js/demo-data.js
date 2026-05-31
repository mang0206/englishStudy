/**
 * demo-data.js
 * 데모 모드에서 사용하는 모든 하드코딩 데이터 + 가짜 비동기 헬퍼.
 *
 * 설계 원칙:
 *  1. 실제 API 응답 JSON 구조를 그대로 모방한다.
 *     - translate  → { scriptId, sentences:[{sentenceId, english, korean}], fromCache }
 *     - feedback   → { results:[{type, userInput, correct, feedback}] }
 *     - dictionary → { query, translations:[{english, pos, nuance, example, exampleKorean}] }
 *     - review     → list/detail 구조 동일
 *  2. 영상/챕터(transcript)는 실제 API를 쓰므로 여기엔 없다.
 *  3. fakeDelay()로 로딩 UX만 흉내 낸다.
 */
const DEMO = (function () {

    // ─────────── 0. 데모 고정 상수 ───────────
    const VIDEO_ID  = 'LBOT2uEZgE0';
    const VIDEO_URL = 'https://www.youtube.com/watch?v=LBOT2uEZgE0';
    const ALLOWED_CHAPTER_TITLE = 'Job Interview';
    const TRANSCRIPT_URL = `/demo/api/transcript/${VIDEO_ID}`;

    // 공통 타입 상수 (IIFE 안으로 이동)
    const TYPE_NAMES = { NEGATIVE:"부정형", PAST:"과거형", FUTURE:"미래형",
                         QUESTION:"질문형", REASON:"이유 추가", CONDITION:"조건" };
    const ALL_TYPES = ["NEGATIVE","PAST","FUTURE","QUESTION","REASON","CONDITION"];

    // ─────────── 1. 번역 결과 ───────────
    const TRANSLATED = {
        scriptId: 9001,
        fromCache: false,
        sentences: [
            { sentenceId: 1, english: "Good afternoon, Mr. Carter. Thanks for coming in today.",
              korean: "카터 씨, 안녕하세요. 오늘 와주셔서 감사합니다." },
            { sentenceId: 2, english: "Good afternoon. Please have a seat.",
              korean: "안녕하세요. 앉으세요." },
            { sentenceId: 3, english: "To start, can you tell me a bit about yourself?",
              korean: "시작하기 전에, 자기소개를 좀 해주시겠어요?" },
            { sentenceId: 4, english: "Sure. My name is Alex Carter. I'm 23 years old and I just graduated from the University of Texas at Austin with a bachelor's degree in business administration.",
              korean: "네. 제 이름은 알렉스 카터입니다. 저는 23세이고 텍사스 대학교 오스틴 캠퍼스에서 경영학 학사 학위를 취득하고 졸업했습니다." },
            { sentenceId: 5, english: "I focused on marketing and management.",
              korean: "마케팅과 경영학을 전공했습니다." },
            { sentenceId: 6, english: "During college, I did a six-month internship at a local startup where I helped with customer outreach and social media.",
              korean: "대학 시절, 저는 지역 스타트업에서 6개월간 인턴으로 일하며 고객 확보 및 소셜 미디어 업무를 도왔습니다." },
            { sentenceId: 7, english: "Great. Why are you interested in this business development associate role at our company?",
              korean: "훌륭하네요. 저희 회사에서 이 비즈니스 개발 담당자 직책에 왜 관심이 있으신가요?" },
            { sentenceId: 8, english: "I really like your company because you make innovative apps for small businesses.",
              korean: "귀사는 소기업을 위한 혁신적인 앱을 만들기 때문에 정말 좋습니다." },
            { sentenceId: 9, english: "I want to work for a fast-moving tech company where I can learn quickly.",
              korean: "빠르게 배우고 성장할 수 있는 역동적인 기술 회사에서 일하고 싶습니다." },
            { sentenceId: 10, english: "This role matches my skills and I think I can add value by finding new partners and clients.",
              korean: "이 직책은 제 기술과 잘 맞고, 새로운 파트너와 고객을 발굴함으로써 가치를 더할 수 있다고 생각합니다." },
            { sentenceId: 11, english: "What do you think are your strongest skills?",
              korean: "본인의 가장 큰 강점은 무엇이라고 생각하시나요?" },
            { sentenceId: 12, english: "My top strengths are communication and organization.",
              korean: "저의 가장 큰 강점은 소통 능력과 조직력입니다." },
            { sentenceId: 13, english: "I'm good at talking to people both in person and online.",
              korean: "저는 직접 대면하거나 온라인으로 사람들과 소통하는 데 능숙합니다." },
            { sentenceId: 14, english: "I'm also quick to learn new software.",
              korean: "또한 새로운 소프트웨어를 빠르게 배울 수 있습니다." },
            { sentenceId: 15, english: "That's useful. Can you tell me about a time you faced a challenge and how you handled it?",
              korean: "유용하겠네요. 어려움에 직면했던 경험과 그것을 어떻게 해결했는지 말씀해주시겠어요?" },
            { sentenceId: 16, english: "Yes. In my senior year, I led a group project for a marketing class, but two team members were sick and couldn't contribute much.",
              korean: "네. 마지막 학년 때, 마케팅 수업에서 그룹 프로젝트를 이끌었는데, 두 명의 팀원이 아파서 많이 기여하지 못했습니다." },
            { sentenceId: 17, english: "The deadline was tight.",
              korean: "마감일이 촉박했습니다." },
            { sentenceId: 18, english: "I reorganized the work, talked to everyone clearly about new tasks, and stayed late a few nights to help finish.",
              korean: "업무를 재편성하고, 새로운 업무에 대해 모든 팀원에게 명확하게 전달했으며, 몇 날 며칠 밤늦게까지 남아 작업을 마치는 것을 도왔습니다." },
            { sentenceId: 19, english: "We got an A on the project, and the professor said our plan was the best in the class.",
              korean: "프로젝트에서 A를 받았고, 교수님께서는 저희 계획이 수업에서 최고였다고 말씀하셨습니다." },
            { sentenceId: 20, english: "Nice example. Teamwork is key here.",
              korean: "좋은 예시입니다. 여기서 팀워크는 매우 중요합니다." },
            { sentenceId: 21, english: "What do you know about our products?",
              korean: "저희 제품에 대해 무엇을 알고 계신가요?" },
            { sentenceId: 22, english: "Your best seller is a simple app that helps small shops manage inventory, payments, and customer loyalty.",
              korean: "귀사의 베스트셀러는 소규모 상점들이 재고, 결제, 고객 충성도를 관리하는 데 도움이 되는 간단한 앱입니다." },
            { sentenceId: 23, english: "I like that it's easy to use and affordable.",
              korean: "사용하기 쉽고 가격도 저렴하다는 점이 마음에 듭니다." },
            { sentenceId: 24, english: "Good research. One more question. What have you taught yourself recently?",
              korean: "잘 조사하셨네요. 마지막 질문입니다. 최근에 스스로 배운 것이 있다면 무엇인가요?" },
            { sentenceId: 25, english: "I recently taught myself how to better understand a company's product and explain its value clearly to potential customers.",
              korean: "최근에는 회사의 제품을 더 잘 이해하고 잠재 고객에게 그 가치를 명확하게 설명하는 방법을 스스로 배웠습니다." },
            { sentenceId: 26, english: "Thank you, Alex. We'll be in touch next week with our decision.",
              korean: "알렉스 씨, 감사합니다. 다음 주에 결정 사항을 가지고 연락드리겠습니다." },
            { sentenceId: 27, english: "Thank you so much for the opportunity. I look forward to hearing from you.",
              korean: "기회를 주셔서 정말 감사합니다. 연락 기다리겠습니다." },
        ],
    };

    const PRESELECTED_IDS = [4, 10, 12];

    // ─────────── 2. 확장 피드백 ───────────
    const EXPANSION = {
        4: {
            inputs: {
                NEGATIVE:  "My name is not Alex Carter.",
                PAST:      "My name was Alex Carter.",
                FUTURE:    "I will graduate from the University of Texas at Austin.",
                QUESTION:  "Are you Alex Carter?",
                REASON:    "I graduated because I love business.",
                CONDITION: "If I graduate, I will find a job.",
            },
            results: [
                { type: "NEGATIVE",  correct: true,  feedback: "자연스러워요." },
                { type: "PAST",      correct: false, feedback: "→ \"My name used to be Alex Carter\" 가 더 자연스러워요." },
                { type: "FUTURE",    correct: true,  feedback: "자연스러워요." },
                { type: "QUESTION",  correct: true,  feedback: "자연스러워요." },
                { type: "REASON",    correct: true,  feedback: "자연스러워요." },
                { type: "CONDITION", correct: true,  feedback: "자연스러워요." },
            ],
        },
        10: {
            inputs: {
                NEGATIVE:  "This role does not match my skills.",
                PAST:      "This role matched my skills.",
                FUTURE:    "This role will match my skills.",
                QUESTION:  "Does this role match my skills?",
                REASON:    "This role matches my skills because I have experience.",
                CONDITION: "If this role matches my skills, I will apply.",
            },
            results: [
                { type: "NEGATIVE",  correct: true,  feedback: "자연스러워요." },
                { type: "PAST",      correct: true,  feedback: "자연스러워요." },
                { type: "FUTURE",    correct: true,  feedback: "자연스러워요." },
                { type: "QUESTION",  correct: true,  feedback: "자연스러워요." },
                { type: "REASON",    correct: false, feedback: "→ \"...because of my relevant experience\" 가 더 자연스러워요." },
                { type: "CONDITION", correct: true,  feedback: "자연스러워요." },
            ],
        },
        12: {
            inputs: {
                NEGATIVE:  "My top strengths are not communication and organization.",
                PAST:      "My top strengths were communication and organization.",
                FUTURE:    "My top strengths will be communication and organization.",
                QUESTION:  "What are your top strengths?",
                REASON:    "Communication is my strength because I talk to people a lot.",
                CONDITION: "If communication is my strength, I can lead a team.",
            },
            results: [
                { type: "NEGATIVE",  correct: true,  feedback: "자연스러워요." },
                { type: "PAST",      correct: true,  feedback: "자연스러워요." },
                { type: "FUTURE",    correct: true,  feedback: "자연스러워요." },
                { type: "QUESTION",  correct: true,  feedback: "자연스러워요." },
                { type: "REASON",    correct: true,  feedback: "자연스러워요." },
                { type: "CONDITION", correct: true,  feedback: "자연스러워요." },
            ],
        },
    };

    // ─────────── 3. 한영 사전 ───────────
    const DICTIONARY = {
        "예정": {
            query: "예정",
            translations: [
                { english: "be going to", pos: "phrase",
                  nuance: "가까운 미래의 계획/예정을 말할 때 가장 흔하게 사용",
                  example: "I'm going to meet him tomorrow.", exampleKorean: "내일 그를 만날 예정이에요." },
                { english: "be scheduled to", pos: "phrase",
                  nuance: "공식 일정/약속이 잡혀 있을 때",
                  example: "The meeting is scheduled to start at 3 PM.", exampleKorean: "회의는 오후 3시에 시작될 예정이에요." },
                { english: "be supposed to", pos: "phrase",
                  nuance: "원래 ~하기로 되어 있을 때 (약한 의무/기대 포함)",
                  example: "I'm supposed to call her back.", exampleKorean: "그녀에게 다시 전화하기로 되어 있어요." },
            ],
        },
        "강점": {
            query: "강점",
            translations: [
                { english: "strength", pos: "n.",
                  nuance: "능력/장점을 말할 때 일반적",
                  example: "My greatest strength is communication.", exampleKorean: "제 가장 큰 강점은 소통이에요." },
                { english: "strong point", pos: "phrase",
                  nuance: "구어체로 '잘하는 부분'을 말할 때",
                  example: "Organization is my strong point.", exampleKorean: "조직력이 제 강점이에요." },
            ],
        },
    };

    // ─────────── 4. 프롬프트 표현 목록 ───────────
    const PROMPT_EXPRESSIONS = PRESELECTED_IDS
        .map(id => TRANSLATED.sentences.find(s => s.sentenceId === id).english);

    // ─────────── 5. 복습 ───────────
    function daysAgo(n) {
        const d = new Date();
        d.setDate(d.getDate() - n);
        return d.toISOString().slice(0, 10);
    }
    const REVIEW_LIST = [
        { selectedId: 101, studyDate: daysAgo(0), englishText: "My top strengths are communication and organization.", correctCount: 6 },
        { selectedId: 102, studyDate: daysAgo(0), englishText: "This role matches my skills and I think I can add value...", correctCount: 5 },
        { selectedId: 103, studyDate: daysAgo(1), englishText: "I want to work for a fast-moving tech company...", correctCount: 4 },
        { selectedId: 104, studyDate: daysAgo(2), englishText: "Teamwork is key here.", correctCount: 6 },
        { selectedId: 105, studyDate: daysAgo(3), englishText: "I'm good at talking to people both in person and online.", correctCount: 5 },
        { selectedId: 106, studyDate: daysAgo(5), englishText: "I reorganized the work and talked to everyone clearly.", correctCount: 3 },
    ];
    const REVIEW_DETAIL = {
        // 101 — My top strengths are communication and organization. (correct 6)
        101: {
            selectedId: 101,
            englishText: "My top strengths are communication and organization.",
            koreanText: "저의 가장 큰 강점은 소통 능력과 조직력입니다.",
            studyDate: daysAgo(0),
            expansions: [
                { type: "NEGATIVE",  typeName: "부정형",   userInput: "My top strengths are not communication and organization.", feedbackText: "자연스러워요.", correct: true },
                { type: "PAST",      typeName: "과거형",   userInput: "My top strengths were communication and organization.",     feedbackText: "자연스러워요.", correct: true },
                { type: "FUTURE",    typeName: "미래형",   userInput: "My top strengths will be communication and organization.",  feedbackText: "자연스러워요.", correct: true },
                { type: "QUESTION",  typeName: "질문형",   userInput: "What are your top strengths?",                              feedbackText: "자연스러워요.", correct: true },
                { type: "REASON",    typeName: "이유 추가", userInput: "Communication is my strength because I talk to people a lot.", feedbackText: "자연스러워요.", correct: true },
                { type: "CONDITION", typeName: "조건",     userInput: "If communication is my strength, I can lead a team.",       feedbackText: "자연스러워요.", correct: true },
            ],
        },

        // 102 — This role matches my skills and I think I can add value... (correct 5)
        102: {
            selectedId: 102,
            englishText: "This role matches my skills and I think I can add value by finding new partners and clients.",
            koreanText: "이 직책은 제 기술과 잘 맞고, 새로운 파트너와 고객을 발굴함으로써 가치를 더할 수 있다고 생각합니다.",
            studyDate: daysAgo(0),
            expansions: [
                { type: "NEGATIVE",  typeName: "부정형",   userInput: "This role does not match my skills.",                  feedbackText: "자연스러워요.", correct: true },
                { type: "PAST",      typeName: "과거형",   userInput: "This role matched my skills.",                         feedbackText: "자연스러워요.", correct: true },
                { type: "FUTURE",    typeName: "미래형",   userInput: "This role will match my skills.",                      feedbackText: "자연스러워요.", correct: true },
                { type: "QUESTION",  typeName: "질문형",   userInput: "Does this role match my skills?",                      feedbackText: "자연스러워요.", correct: true },
                { type: "REASON",    typeName: "이유 추가", userInput: "This role matches my skills because I have experience.", feedbackText: "→ \"...because of my relevant experience\" 가 더 자연스러워요.", correct: false },
                { type: "CONDITION", typeName: "조건",     userInput: "If this role matches my skills, I will apply.",        feedbackText: "자연스러워요.", correct: true },
            ],
        },

        // 103 — I want to work for a fast-moving tech company... (correct 4)
        103: {
            selectedId: 103,
            englishText: "I want to work for a fast-moving tech company where I can learn quickly.",
            koreanText: "빠르게 배우고 성장할 수 있는 역동적인 기술 회사에서 일하고 싶습니다.",
            studyDate: daysAgo(1),
            expansions: [
                { type: "NEGATIVE",  typeName: "부정형",   userInput: "I don't want to work for a slow company.",             feedbackText: "자연스러워요.", correct: true },
                { type: "PAST",      typeName: "과거형",   userInput: "I wanted to work for a fast-moving tech company.",     feedbackText: "자연스러워요.", correct: true },
                { type: "FUTURE",    typeName: "미래형",   userInput: "I will work for a fast-moving tech company.",          feedbackText: "자연스러워요.", correct: true },
                { type: "QUESTION",  typeName: "질문형",   userInput: "Do you want to work for a fast-moving tech company?",  feedbackText: "자연스러워요.", correct: true },
                { type: "REASON",    typeName: "이유 추가", userInput: "I want to work there because is fast.",               feedbackText: "→ \"because it is fast-paced\" 처럼 주어를 넣어야 자연스러워요.", correct: false },
                { type: "CONDITION", typeName: "조건",     userInput: "If the company is fast, I want work there.",           feedbackText: "→ \"I want to work there\" 로 to를 넣어주세요.", correct: false },
            ],
        },

        // 104 — Teamwork is key here. (correct 6)
        104: {
            selectedId: 104,
            englishText: "Teamwork is key here.",
            koreanText: "여기서 팀워크는 매우 중요합니다.",
            studyDate: daysAgo(2),
            expansions: [
                { type: "NEGATIVE",  typeName: "부정형",   userInput: "Teamwork is not key here.",                feedbackText: "자연스러워요.", correct: true },
                { type: "PAST",      typeName: "과거형",   userInput: "Teamwork was key here.",                   feedbackText: "자연스러워요.", correct: true },
                { type: "FUTURE",    typeName: "미래형",   userInput: "Teamwork will be key here.",               feedbackText: "자연스러워요.", correct: true },
                { type: "QUESTION",  typeName: "질문형",   userInput: "Is teamwork key here?",                    feedbackText: "자연스러워요.", correct: true },
                { type: "REASON",    typeName: "이유 추가", userInput: "Teamwork is key here because we work together.", feedbackText: "자연스러워요.", correct: true },
                { type: "CONDITION", typeName: "조건",     userInput: "If we work as a team, we can succeed.",    feedbackText: "자연스러워요.", correct: true },
            ],
        },

        // 105 — I'm good at talking to people both in person and online. (correct 5)
        105: {
            selectedId: 105,
            englishText: "I'm good at talking to people both in person and online.",
            koreanText: "저는 직접 대면하거나 온라인으로 사람들과 소통하는 데 능숙합니다.",
            studyDate: daysAgo(3),
            expansions: [
                { type: "NEGATIVE",  typeName: "부정형",   userInput: "I'm not good at talking to people online.",   feedbackText: "자연스러워요.", correct: true },
                { type: "PAST",      typeName: "과거형",   userInput: "I was good at talking to people.",            feedbackText: "자연스러워요.", correct: true },
                { type: "FUTURE",    typeName: "미래형",   userInput: "I will be good at talking to people.",        feedbackText: "자연스러워요.", correct: true },
                { type: "QUESTION",  typeName: "질문형",   userInput: "Are you good at talking to people?",          feedbackText: "자연스러워요.", correct: true },
                { type: "REASON",    typeName: "이유 추가", userInput: "I'm good at talking because I like people.",  feedbackText: "자연스러워요.", correct: true },
                { type: "CONDITION", typeName: "조건",     userInput: "If I talk to people, I am happy.",            feedbackText: "→ \"If I get to talk to people, I feel happy\" 가 더 자연스러워요.", correct: false },
            ],
        },

        // 106 — I reorganized the work and talked to everyone clearly. (correct 3)
        106: {
            selectedId: 106,
            englishText: "I reorganized the work and talked to everyone clearly.",
            koreanText: "업무를 재편성하고 모든 팀원에게 명확하게 전달했습니다.",
            studyDate: daysAgo(5),
            expansions: [
                { type: "NEGATIVE",  typeName: "부정형",   userInput: "I did not reorganize the work.",              feedbackText: "자연스러워요.", correct: true },
                { type: "PAST",      typeName: "과거형",   userInput: "I reorganized the work.",                     feedbackText: "자연스러워요.", correct: true },
                { type: "FUTURE",    typeName: "미래형",   userInput: "I will reorganize the work.",                 feedbackText: "자연스러워요.", correct: true },
                { type: "QUESTION",  typeName: "질문형",   userInput: "Did you reorganized the work?",               feedbackText: "→ \"Did you reorganize the work?\" 로 동사원형을 쓰세요.", correct: false },
                { type: "REASON",    typeName: "이유 추가", userInput: "I reorganized because deadline was tight.",   feedbackText: "→ \"because the deadline was tight\" 로 the를 넣어주세요.", correct: false },
                { type: "CONDITION", typeName: "조건",     userInput: "If work is messy, I reorganize it.",          feedbackText: "→ \"If the work is messy, I reorganize it\" 가 더 자연스러워요.", correct: false },
            ],
        },
    };

    // detail 없으면 list에서 생성 (IIFE 안으로 이동)
    function buildDetailFromList(id) {
        const item = REVIEW_LIST.find(x => x.selectedId === id);
        if (!item) return null;
        const expansions = ALL_TYPES.map((type, i) => ({
            type,
            typeName: TYPE_NAMES[type],
            userInput: `(데모) ${type} 변형 예시`,
            feedbackText: i < item.correctCount ? "자연스러워요." : "→ 더 자연스러운 표현을 제안해요.",
            correct: i < item.correctCount,
        }));
        return {
            selectedId: id,
            englishText: item.englishText,
            koreanText: "(데모 한국어 번역)",
            studyDate: item.studyDate,
            expansions,
        };
    }

    // ─────────── 6. 트래커 ───────────
    const TRACKER_WEEK = {
        totalTasks: 12,
        completedTasks: 9,
        studyTimeLabel: "1시간 12분",
        streakDays: 4,
        blocks: [
            { block: "SHADOWING",       displayName: "쉐도잉",     icon: "🎧", timeLabel: "1시간 30분",
              completedTasks: 3, totalTasks: 3, progressPercent: 100 },
            { block: "EXPANSION",       displayName: "문장 확장",   icon: "🧩", timeLabel: "1시간 30분",
              completedTasks: 4, totalTasks: 4, progressPercent: 100 },
            { block: "AI_CONVERSATION", displayName: "AI 회화",    icon: "🗣", timeLabel: "2시간",
              completedTasks: 2, totalTasks: 3, progressPercent: 67 },
            { block: "READING",         displayName: "읽기 / 듣기", icon: "📖", timeLabel: "30분",
              completedTasks: 0, totalTasks: 2, progressPercent: 0 },
        ],
        weekDays: [
            { dayName: "월", state: "done-full" },
            { dayName: "화", state: "done-full" },
            { dayName: "수", state: "done-partial" },
            { dayName: "목", state: "done-full" },
            { dayName: "금", state: "today" },
            { dayName: "토", state: "future" },
            { dayName: "일", state: "future" },
        ],
    };

    // 태스크 라벨 (IIFE 안으로 이동 + 공개)
    const TASK_LABELS = {
        SHADOWING: [
            "15분 — 스크립트 없이 영상 반복 시청",
            "30분 — 스크립트 보면서 천천히 따라 말하기",
            "45분 — 스크립트 덮고 따라 말하기 반복",
        ],
        EXPANSION: [
            "오늘 배운 문장 3~5개 선택",
            "각 문장 10개 이상 변형 (시제/부정/질문)",
            "소리 내서 읽으면서 노트에 쓰기",
            "AI한테 자연스러운지 확인받기",
        ],
        AI_CONVERSATION: [
            "1시간 — 오늘 배운 표현 의도적으로 써먹기",
            "1시간 — 자유 대화 (막혀도 영어로만)",
            "AI 교정 내용 즉시 다시 써먹기",
        ],
        READING: [
            "관심 있는 영어 유튜브 자막 켜고 보기",
            "공부 아닌 노출 목적으로 가볍게",
        ],
    };

    // ─────────── 가짜 비동기 헬퍼 ───────────
    function fakeDelay(ms = 1200) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    function fakeFetch(data, ms) {
        return fakeDelay(ms).then(() => structuredClone(data));
    }

    // ─────────── 공개 API ───────────
    return {
        VIDEO_ID,
        VIDEO_URL,
        TRANSCRIPT_URL,
        ALLOWED_CHAPTER_TITLE,
        TRANSLATED,
        PRESELECTED_IDS,
        EXPANSION,
        DICTIONARY,
        PROMPT_EXPRESSIONS,
        REVIEW_LIST,
        REVIEW_DETAIL,
        TRACKER_WEEK,
        TASK_LABELS,        // ★ 추가
        fakeDelay,
        fakeFetch,

        translate: () => fakeFetch(TRANSLATED, 1000),
        feedback: (selectedId) => fakeFetch(
            { results: (EXPANSION[selectedId] || EXPANSION[4]).results }, 900),
        dictionary: (q) => {
            const hit = DICTIONARY[q.trim()];
            return fakeFetch(hit || { query: q, translations: [] }, 700);
        },
        reviewList: () => fakeFetch(REVIEW_LIST, 400),
        reviewDetail: (id) => fakeFetch(REVIEW_DETAIL[id] || buildDetailFromList(id), 300),
    };
})();

window.DEMO = DEMO;