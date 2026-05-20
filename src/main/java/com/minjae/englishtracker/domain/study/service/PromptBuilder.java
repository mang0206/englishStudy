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
                """.formatted(original, expansionsText);
    }
}
