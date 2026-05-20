package com.minjae.englishtracker.domain.study.dto;

import com.minjae.englishtracker.domain.study.entity.ExpansionType;
import lombok.*;

import java.util.List;
import java.util.Map;

public class ExpansionDtos {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class FeedbackRequest {
        private Long selectedSentenceId;
        private Map<ExpansionType, String> expansions;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class FeedbackItem {
        private ExpansionType type;
        private String userInput;
        private boolean correct;
        private String feedback;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class FeedbackResponse {
        private List<FeedbackItem> results;
    }
}
