# English Study Tracker

> 어학연수 준비를 위한 개인 영어 학습 웹 서비스
>
> Gemini AI 기반 스크립트 번역 · 문장 확장 피드백, Redis Pub/Sub을 활용한 Elasticsearch 비동기 색인, Docker Compose 단일 명령 배포까지 직접 설계하고 구현한 풀스택 사이드 프로젝트입니다.

---

## 프로젝트 배경

단순히 영어 공부를 위한 앱이 아니라, **실무에서 다루고 싶은 기술 스택을 직접 붙여보는 것**이 목표였습니다.

- 평소 업무에서 사용하던 Redis와 Elasticsearch를 직접 연동 설계해보고 싶었습니다.
- AI API(Gemini)를 백엔드에서 호출해서 실질적인 가치를 만드는 경험이 필요했습니다.
- Docker Compose로 전체 인프라를 코드로 관리하고, 서버 배포까지 직접 해보는 것을 목표로 했습니다.

---

## 주요 기능

### 학습 탭
유튜브 Easy English 채널과 함께 3단계 학습을 진행합니다.

**① 쉐도잉**
- 유튜브 스크립트를 붙여넣으면 Gemini API가 타임스탬프·지문 외 텍스트를 제거하고 문장 단위로 번역
- 영문/한글 번역 각각 토글로 보이기/숨기기 가능
- 쉐도잉 완료 후 오늘 집중할 문장 3~5개 선택

**② 문장 확장**
- 선택한 문장을 부정형 · 과거형 · 미래형 · 질문형 · 이유 추가 · 조건 6가지로 직접 변형 작성
- 작성 완료 후 Gemini API로 피드백 — 자연스러운지 여부와 더 나은 표현 인라인 제안

**③ AI 회화 프롬프트 자동 생성**
- 오늘 학습한 문장이 자동으로 채워진 ChatGPT/Claude용 프롬프트 2개 생성 (복사 버튼 제공)

### 복습 탭
- 과거에 선택한 문장 전체를 최신순으로 조회
- **Elasticsearch full-text 검색** — 알파벳 입력 즉시 필터링
- 문장별 이전 변형 작성 내용 + 피드백 토글 조회

### 관리 탭
- 뇌새김 · 쉐도잉 · 문장 확장 · AI 회화 · 읽기/듣기 5개 블록 체크리스트
- 학습 탭 완료 시 쉐도잉·문장 확장 블록 **자동 체크 연동**
- 연속 학습 스트릭 + 주간 캘린더

---

## 기술 스택

| 구분 | 기술 |
|---|---|
| Backend | Spring Boot 3.2, Spring Data JPA |
| Template Engine | Thymeleaf |
| Database | PostgreSQL 16 |
| Cache / MQ | Redis 7 (Pub/Sub) |
| Search | Elasticsearch 8 |
| AI | Gemini API |
| Container | Docker, Docker Compose |
| Frontend | Vanilla JS, Fetch API |

---

## 아키텍처 — Redis Pub/Sub 비동기 색인

문장 선택 완료 시 PostgreSQL 저장과 Elasticsearch 색인을 **이벤트 기반으로 분리**했습니다.

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

DB 저장과 검색 색인을 직접 결합하지 않고 Redis Pub/Sub을 중간에 둠으로써 **관심사 분리**와 **색인 실패가 주 흐름에 영향을 주지 않는 구조**를 목표로 설계했습니다.

---

## 인프라 — Docker Compose

로컬 개발과 서버 배포를 동일한 `docker-compose.yml` 하나로 관리합니다.

```yaml
services:
  app:         # Spring Boot (Dockerfile 빌드)
  db:          # PostgreSQL 16
  redis:       # Redis 7-alpine
  elasticsearch: # Elasticsearch 8
```

`app` 서비스는 `depends_on` + `healthcheck`로 db · redis · elasticsearch가 모두 준비된 뒤에 시작됩니다.

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

| 테이블 | 설명 |
|---|---|
| `scripts` | 날짜별 원본 스크립트 입력값 |
| `script_sentences` | 문장 단위 분리 저장 (순서 포함) |
| `selected_sentences` | 쉐도잉 완료 후 선택한 문장 |
| `expansion_practices` | 문장 확장 입력 + Gemini 피드백 결과 |
| `daily_records` | 블록별 완료 수 + 메모 |
| `task_checks` | 개별 태스크 체크 상태 |

---

## 실행 방법

### 사전 요구사항
- Docker, Docker Compose
- Gemini API Key

### 환경변수

프로젝트 루트에 `.env` 파일 생성:

```env
DB_USERNAME=postgres
DB_PASSWORD=your_password
GEMINI_API_KEY=your_gemini_api_key
```

### 실행

```bash
docker compose up -d
```

http://localhost:8080

```bash
# 종료
docker compose down

# 데이터 볼륨 포함 전체 삭제
docker compose down -v
```

---

## 프로젝트 구조

```
src/main/java/com/minjae/englishtracker/
├── controller/        TrackerController, StudyController, ReviewController
├── domain/            엔티티 + enum (StudyBlock, ExpansionType)
├── repository/        JPA Repository
├── service/           TrackerService, StudyService, ReviewService
├── dto/               View DTO
└── infra/
    ├── gemini/        Gemini API 클라이언트
    ├── redis/         Publisher, Subscriber
    └── elasticsearch/ ES 색인 서비스

src/main/resources/
├── templates/
│   ├── tracker/       관리 탭
│   ├── study/         학습 탭
│   └── review/        복습 탭
└── static/
    ├── css/style.css
    └── js/
```
