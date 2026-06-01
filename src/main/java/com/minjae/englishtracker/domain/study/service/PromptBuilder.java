package com.minjae.englishtracker.domain.study.service;

import com.minjae.englishtracker.domain.study.entity.ExpansionType;

import java.util.Map;
import java.util.stream.Collectors;

class PromptBuilder {

    static String translation(String rawScript) {
        return """
                다음은 유튜브 영상 스크립트입니다. 다음 작업을 수행해주세요:
                
                1. 타임스탬프 (예: 0:08, 0:12) 모두 제거
                2. [applause], [music], [laughter] 같은 지문 외 텍스트 모두 제거
                3. 짧게 잘린 문장들을 자연스럽게 합쳐서 완전한 문장 단위로 만들기
                4. 각 문장을 한국어로 자연스럽게 번역
                
                반드시 아래 JSON 형식으로만 응답하세요. 다른 설명이나 마크다운 코드블럭(```)은 절대 포함하지 마세요:
                
                {
                  "sentences": [
                    {"english": "영문장1", "korean": "한국어 번역1"},
                    {"english": "영문장2", "korean": "한국어 번역2"}
                  ]
                }
                
                === 스크립트 ===
                %s
                """.formatted(rawScript);
    }

    static String expansionFeedback(String original, Map<ExpansionType, String> expansions) {
        String expansionsText = expansions.entrySet().stream()
                .map(e -> "- " + e.getKey().name() + " (" + e.getKey().getDisplayName() + "): " + (e.getValue() == null ? "" : e.getValue()))
                .collect(Collectors.joining("\n"));

        return """
                원문: "%s"
                
                아래는 위 원문을 사용자가 다양한 형태로 변형한 결과입니다.
                각 변형에 대해 영어 표현이 자연스러운지 판단하고 피드백을 주세요.
                
                === 변형 결과 ===
                %s
                
                반드시 아래 JSON 형식으로만 응답하세요. 다른 설명이나 마크다운 코드블럭(```)은 절대 포함하지 마세요:
                
                {
                  "results": [
                    {"type": "NEGATIVE", "isCorrect": true, "feedback": "자연스러워요"},
                    {"type": "PAST", "isCorrect": false, "feedback": "→ \\"더 자연스러운 표현\\" 이 더 자연스러워요"}
                  ]
                }
                
                type 값은 다음 중 하나여야 합니다: NEGATIVE, PAST, FUTURE, QUESTION, REASON, CONDITION
                사용자가 빈칸으로 둔 항목은 isCorrect=false, feedback="작성하지 않았습니다"로 응답하세요.
                만약 "isCorrect: False" 라면, 반드시 올바른 변형 예시를 큰따옴표로 명확하게 제시할 것
                절대 정답 변형 없이 피드백만 주지 말 것
                
                판정 기준:
                - 대소문자(첫 글자 대문자 여부), 문장 끝 마침표·물음표·느낌표, 앞뒤 공백처럼 표현의 의미와 무관한 차이는 무시하고 isCorrect=true로 판정할 것
                - 단어 선택, 어순, 시제, 문법 구조가 자연스러우면 정답으로 처리할 것
                - 철자 오류, 문법 오류, 부자연스러운 표현일 때만 isCorrect=false로 판정할 것
                """.formatted(original, expansionsText);
    }

    static String dictionary(String koreanWord) {
        return """
                다음 한국어 단어/표현에 해당하는 영어 표현을 알려주세요.
                
                한국어: %s
                
                반드시 아래 JSON 형식으로만 응답하세요. 마크다운 코드블럭(```) 없이 순수 JSON만 응답:
                
                {
                  "translations": [
                    {
                      "english": "영어 표현 (단어 또는 구문)",
                      "pos": "품사 (n. / v. / adj. / phrase / idiom 등)",
                      "nuance": "언제 쓰는지 구체적으로 (예: '공식 일정/약속을 잡을 때', '미래에 ~할 계획이라고 말할 때')",
                      "example": "이 표현을 사용한 자연스러운 예문",
                      "exampleKorean": "예문의 한국어 번역"
                    }
                  ]
                }
                
                규칙:
                1. 가장 자주 사용하는 실전 회화 표현부터 우선 제공
                2. 단어뿐 아니라 phrase / idiom / 패턴 표현도 적극 포함
                   예:
                   - "예정" → "be going to", "be scheduled to", "be supposed to"
                   - "포기하다" → "give up", "quit", "drop out"
                3. 한국어 표현이 여러 의미를 가지면 **의미별로 다른 표현 그룹**으로 분리해서 모두 제공
                4. nuance는 한국어로, 구체적으로 (단순히 "계획" 같은 동의어 말고 사용 맥락 설명)
                5. 각 표현마다 예문을 반드시 포함
                6. 총 2~4개의 표현 제공
                7. 검색어가 동사나 표현이면 동사/구문 위주로, 명사면 명사 위주로
                8. 같은 의미의 표현은 중복 설명하지 말고 nuance 차이 중심으로 설명
                9. 영어 표현은 실제 원어민이 자주 쓰는 순서대로 정렬
                10. 너무 사전식/문어체 표현은 제외
                11. JSON 외 다른 텍스트 절대 금지
                """.formatted(koreanWord);
    }
}
