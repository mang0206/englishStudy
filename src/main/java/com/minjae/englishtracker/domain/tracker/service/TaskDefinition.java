package com.minjae.englishtracker.domain.tracker.service;

import com.minjae.englishtracker.global.enums.StudyBlock;

import java.util.List;
import java.util.Map;

public class TaskDefinition {

    public static final Map<StudyBlock, List<String>> TASKS = Map.of(
        StudyBlock.SHADOWING, List.of(
            "15분 — 스크립트 없이 영상 반복 시청",
            "30분 — 스크립트 보면서 천천히 따라 말하기",
            "45분 — 스크립트 덮고 따라 말하기 반복"
        ),
        StudyBlock.EXPANSION, List.of(
            "오늘 배운 문장 3~5개 선택",
            "각 문장 10개 이상 변형 (시제/부정/질문)",
            "소리 내서 읽으면서 노트에 쓰기",
            "AI한테 자연스러운지 확인받기"
        ),
        StudyBlock.AI_CONVERSATION, List.of(
            "1시간 — 오늘 배운 표현 의도적으로 써먹기",
            "1시간 — 자유 대화 (막혀도 영어로만)",
            "AI 교정 내용 즉시 다시 써먹기"
        ),
        StudyBlock.READING, List.of(
            "관심 있는 영어 유튜브 자막 켜고 보기",
            "공부 아닌 노출 목적으로 가볍게"
        )
    );

    public static List<String> get(StudyBlock block) {
        return TASKS.getOrDefault(block, List.of());
    }

    public static int count(StudyBlock block) {
        return get(block).size();
    }
}
