package com.minjae.englishtracker.global.infra.transcript;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;

import java.util.List;

/**
 * FastAPI transcript-service의 응답 DTO.
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class TranscriptResponse {

    private String videoId;
    private String title;
    private List<Chapter> chapters;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Chapter {
        private String title;
        private Double startSec;
        private Double endSec;
        private String transcript;
    }
}
