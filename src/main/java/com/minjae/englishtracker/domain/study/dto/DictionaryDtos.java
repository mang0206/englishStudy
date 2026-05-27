package com.minjae.englishtracker.domain.study.dto;

import lombok.*;

import java.util.List;

public class DictionaryDtos {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class DictionaryResponse {
        private String query;
        private List<Translation> translations;
        private String example;
        private String exampleKorean;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Translation {
        private String english;
        private String pos;
        private String nuance;
        private String example;
        private String exampleKorean;
    }
}