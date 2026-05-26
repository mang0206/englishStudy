package com.minjae.englishtracker.domain.study.dto;

import lombok.*;

import java.util.List;

public class StudyDtos {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class TranslateRequest {
        private String rawScript;
        private String videoId;
        private String chapterTitle;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class TranslatedSentence {
        private Long sentenceId;
        private String english;
        private String korean;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class TranslateResponse {
        private Long scriptId;
        private List<TranslatedSentence> sentences;
        private boolean fromCache;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class SelectSentencesRequest {
        private List<Long> sentenceIds;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class SelectedSentenceDto {
        private Long selectedId;
        private String englishText;
        private String koreanText;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class SelectSentencesResponse {
        private List<SelectedSentenceDto> selected;
    }
}
