# English Study Tracker

> 개인 영어 학습 웹 서비스
>
> Spring AI 기반 LLM 추상화, Redis Pub/Sub을 활용한 Elasticsearch 비동기 색인, YouTube 챕터 및 자막 자동 추출, 학습 시간 자동 측정, Docker Compose 배포까지 직접 설계하고 구현한 풀스택 사이드 프로젝트입니다.

---

## 프로젝트 목표

- Redis의 pub/sub을 활용한 이벤트와 Elasticsearch 기반 검색 엔진 도입
- Spring AI를 활용해 LLM Provider 추상화 도입
- YouTube 챕터별 자막 자동 추출을 위한 Python 마이크로서비스 분리
- Docker Compose로 전체 인프라를 관리하고, 서버 배포
---

## 주요 기능

### 학습 탭
유튜브 Easy English 채널과 함께 3단계 학습을 진행

**① 쉐도잉**
- 유튜브 영상 URL 입력 → YouTube IFrame Player API 기반 영상 임베드
- FastAPI 마이크로서비스가 yt-dlp로 챕터 정보 + 챕터별 자막을 자동 추출
- 챕터 선택 시 영상이 해당 구간으로 자동 이동 + 자막 자동 채워짐
- 영상 반복 재생(구간 루프), 처음부터 재생, 배속 조절(0.75x ~ 1.5x) 기능
- Spring AI ChatClient를 통해 Gemini가 문장 단위 번역
- 번역 결과 캐싱 — 같은 영상의 같은 챕터는 (videoId, chapterTitle) 키로 캐시 히트 시 즉시 반환
- 영문/한글 번역 각각 토글로 보이기/숨기기 가능
- 쉐도잉 완료 후 오늘 집중할 문장 3~5개 선택

**② 문장 확장**
- 선택한 문장을 부정형 · 과거형 · 미래형 · 질문형 · 이유 추가 · 조건 6가지로 직접 변형 작성
- Spring AI 피드백 — 자연스러운지 여부와 더 나은 표현 인라인 제안
- 한영 사전 패널 — 학습 중 떠오르는 한글 단어를 즉시 검색, Gemini가 3~6개 영어 표현을 뉘앙스/예문과 함께 반환

**③ AI 회화 프롬프트 자동 생성**
- 오늘 학습한 문장이 자동으로 채워진 ChetGpt용 프롬프트 2개 생성

**학습 타이머**

- 학습 사이클 동안 네비바 우측에 타이머가 자동으로 표시 및 작동
- 번역 시작 시 자동으로 카운트 시작, 일시정지/재개 버튼 제공
- 다른 탭(복습/관리)으로 이동 시 자동 일시정지, 학습 탭 복귀 시 자동 재개
- AI 회화 페이지 도달 시 누적 시간이 자동으로 DB 저장 + 타이머 초기화

**학습 단계 복구 (sessionStorage)**

- 학습 도중 다른 탭으로 이동 후 돌아오면 이전 단계 화면으로 자동 복귀
    - 영상 + 챕터 + 스크립트 + 진행 단계 모두 복원
    - 쉐도잉 → 확장 → AI 회화 어느 단계든 마지막 위치로 정확히 복귀
    - 확장 페이지의 경우 현재 문장 인덱스 + 피드백 결과까지 복구

- "새 학습 시작" 클릭 시에만 학습 사이클 완전 초기화

### 복습 탭
- 과거에 선택한 문장 전체를 최신순으로 조회
- **Elasticsearch full-text 검색** — 알파벳 입력 즉시 필터링
- ES 장애 시 DB 폴백 처리로 가용성 확보
- 문장별 변형 작성 내용 + 피드백 조회

### 관리 탭
- 학습 여부 체크리스트
- 학습 탭 완료 시 쉐도잉·문장 확장 블록 **자동 체크 연동**
- 연속 학습 스트릭 + 주간 캘린더
- 학습 시간 자동 누적 — 학습 사이클에서 측정한 시간이 일별로 표시
- 연속 학습 스트릭 + 주간 캘린더

---

## 기술 스택

| 구분 | 기술 |
|---|---|
| Backend | Spring Boot 3.4, Spring Data JPA |
| AI | Spring AI 1.1 + Google GenAI (Gemini) |
| Transcript | FastAPI + yt-dlp (마이크로서비스) |
| Template Engine | Thymeleaf |
| Database | PostgreSQL 16 |
| Cache / MQ | Redis 7 (Pub/Sub) |
| Search | Elasticsearch 8 |
| Container | Docker, Docker Compose |
| Frontend | Vanilla JS, Fetch API |

---

## 아키텍처

### 1. Spring AI 기반 LLM 추상화

도메인 코드가 특정 LLM Provider에 결합되지 않도록 `AiClient` 래퍼로 한 단계 추상화

```java
@Component
public class AiClient {
    private final ChatClient chatClient;

    public AiClient(ChatModel chatModel) {
        this.chatClient = ChatClient.builder(chatModel).build();
    }

    public String generate(String prompt) {
        return chatClient.prompt().user(prompt).call().content();
    }
}
```

Provider 교체는 `application.yml`만 수정하면 됩니다. (Gemini → OpenAI → Anthropic 등)

### 2. Redis Pub/Sub 비동기 색인

문장 선택 완료 시 PostgreSQL 저장과 Elasticsearch 색인을 **이벤트 기반으로 분리**

```
문장 선택 완료
  ├── PostgreSQL 저장 (selected_sentences)
  └── Redis Publisher → 채널: sentence.selected
                              ↓
                   ElasticsearchSubscriber
                              ↓
                   ES 색인 (id, english_text, study_date)
                              ↓
                   복습 탭 full-text 검색
```

DB 저장과 검색 색인을 직접 결합하지 않고 Redis Pub/Sub을 중간에 둠으로써 **관심사 분리**와 **색인 실패가 주 흐름에 영향을 주지 않는 구조**를 목표로 설계. 
또한 ES 장애 시 검색 API는 DB 스캔으로 폴백되어 가용성을 확보.

### 3. 도메인 주도 패키지 구조

```
com.minjae.englishtracker
├── domain/
│   ├── study/      쉐도잉, 번역, 문장 확장 - entity, repository, service, controller, dto
│   ├── review/     복습, ES 검색 - service, controller, dto
│   └── tracker/    일일 루틴 - entity, repository, service, controller, dto
└── global/
    ├── config/         RedisConfig
    ├── enums/          StudyBlock (study/tracker 공유)
    ├── exception/      DomainException, ErrorCode, GlobalExceptionHandler
    └── infra/
        ├── ai/             AiClient (Spring AI 래퍼)
        ├── redis/          Pub/Sub
        └── elasticsearch/  ES Document/Repository
```
### 4. YouTube Transcript 마이크로서비스
YouTube 자막 추출은 Python 생태계의 yt-dlp 활용성이 높고 JVM 환경에서는 구현·유지보수 부담이 커, 해당 기능을 FastAPI 마이크로서비스로 분리.

   Spring Boot (8080)
   │
   │ HTTP /transcript?videoId=...
   ↓
   FastAPI (8000)
   │
   ├── yt-dlp로 영상 메타데이터 + 챕터 정보 + 자막 URL 추출
   ├── 챕터별로 자막을 시간 범위로 슬라이싱

yt-dlp의 player_client: ["web_safari", "mweb"] 옵션과 내부 자막 URL을 활용해 봇 차단 회피
챕터 정보가 있으면 챕터 단위로, 없으면 전체 자막을 반환
Docker Compose의 같은 네트워크에서 통신 (http://transcript:8000)


### 5. 글로벌 예외 처리

`DomainException` + `ErrorCode` enum 기반의 일관된 에러 응답 구조

```java
public enum ErrorCode {
    SCRIPT_NOT_FOUND(HttpStatus.NOT_FOUND, "S001", "스크립트를 찾을 수 없습니다."),
    INVALID_SELECTION_COUNT(HttpStatus.BAD_REQUEST, "S004", "문장은 3~5개를 선택해야 합니다."),
    AI_PARSING_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "A001", "AI 응답 파싱에 실패했습니다."),
    // ...
}

throw new DomainException(ErrorCode.INVALID_SELECTION_COUNT);
```

`GlobalExceptionHandler`에서 통일된 `ErrorResponse` JSON으로 변환

---

## DB 설계

```
scripts
  └── script_sentences (1:N)
        └── selected_sentences (1:N)
              └── expansion_practices (1:N)

daily_records
task_checks
```

| 테이블 | 설명                   |
|---|----------------------|
| `scripts` | 날짜별 원본 스크립트 입력값      |
| `script_sentences` | 문장 단위 분리 저장 (순서 포함)  |
| `selected_sentences` | 쉐도잉 완료 후 선택한 문장      |
| `expansion_practices` | 문장 확장 입력 + AI 피드백 결과 |
| `daily_records` | 블록별 완료 수 + 메모 + 누적 학습 시간(초)     |
| `task_checks` | 개별 태스크 체크 상태         |

---

## 화면 설계
<img width="742" height="456" alt="image" src="https://github.com/user-attachments/assets/00a66e84-4ff4-45c0-9cf8-49cb98d3378a" />

<img width="741" height="459" alt="image" src="https://github.com/user-attachments/assets/5a43ce11-cd19-4251-b54c-e269176a6ec6" />

<img width="747" height="459" alt="image" src="https://github.com/user-attachments/assets/d0c50422-7de7-4f00-b0aa-7fbb5726f4fe" />

<img width="744" height="405" alt="image" src="https://github.com/user-attachments/assets/840395f7-e52a-4663-995d-b990053cfa78" />

<img width="746" height="533" alt="image" src="https://github.com/user-attachments/assets/facd43c0-5fd5-40d9-9e4b-64f80a4cf1c0" />

<img width="745" height="360" alt="image" src="https://github.com/user-attachments/assets/f8a0f34e-9670-4652-8dc7-c1f7b78bc70f" />

<img width="746" height="559" alt="image" src="https://github.com/user-attachments/assets/8e563d05-fdcc-426e-a429-491c252b5baf" />

---

## 프로젝트 구조

```
src/main/java/com/minjae/englishtracker/
├── EnglishTrackerApplication.java
├── domain/
│   ├── study/
│   │   ├── entity/        Script, ScriptSentence, SelectedSentence, ExpansionPractice, ExpansionType
│   │   ├── repository/    JPA Repositories
│   │   ├── service/       StudyService, PromptBuilder
│   │   ├── controller/    StudyController
│   │   └── dto/           StudyDtos, ExpansionDtos
│   ├── review/
│   │   ├── service/       ReviewService (ES 검색 + DB 폴백)
│   │   ├── controller/    ReviewController
│   │   └── dto/           ReviewDtos
│   └── tracker/
│       ├── entity/        DailyRecord, TaskCheck
│       ├── repository/    JPA Repositories
│       ├── service/       TrackerService, TaskDefinition
│       ├── controller/    TrackerController
│       └── dto/           TrackerDtos
└── global/
    ├── config/            RedisConfig
    ├── enums/             StudyBlock
    ├── exception/         DomainException, ErrorCode, ErrorResponse, GlobalExceptionHandler
    └── infra/
        ├── ai/            AiClient
        ├── redis/         SentenceSelectedEvent, Publisher, Subscriber
        └── elasticsearch/ SelectedSentenceDocument, SearchRepository

src/main/resources/
├── application.yml
├── templates/
│   ├── fragments/navbar.html
│   ├── tracker/day.html
│   ├── study/index.html, expansion.html, prompt.html
│   └── review/index.html
└── static/
    ├── css/style.css
    └── js/common.js, tracker.js, study.js, expansion.js, prompt.js, review.js
```
