package com.minjae.englishtracker.domain.review.dto;

import com.minjae.englishtracker.domain.study.entity.ExpansionType;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

public class ReviewDtos {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ReviewListItem {
        private Long selectedId;
        private LocalDate studyDate;
        private String englishText;
        private int correctCount;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ExpansionDetail {
        private ExpansionType type;
        private String typeName;
        private String userInput;
        private String feedbackText;
        private boolean correct;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ReviewDetail {
        private Long selectedId;
        private String englishText;
        private String koreanText;
        private LocalDate studyDate;
        private List<ExpansionDetail> expansions;
    }
}
