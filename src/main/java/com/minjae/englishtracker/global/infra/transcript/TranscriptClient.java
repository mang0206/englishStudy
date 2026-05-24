package com.minjae.englishtracker.global.infra.transcript;

import com.minjae.englishtracker.global.exception.DomainException;
import com.minjae.englishtracker.global.exception.ErrorCode;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.Duration;

/**
 * FastAPI transcript-service 호출 클라이언트.
 */
@Slf4j
@Component
public class TranscriptClient {

    @Value("${app.transcript.base-url:http://localhost:8000}")
    private String baseUrl;

    private RestClient restClient;

    @PostConstruct
    void init() {
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .build();
        log.info("TranscriptClient initialized: baseUrl={}", baseUrl);
    }

    /**
     * 영상 ID로 챕터별 자막을 가져온다.
     */
    public TranscriptResponse fetchTranscript(String videoId) {
        try {
            return restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/transcript")
                            .queryParam("videoId", videoId)
                            .build())
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, (req, res) -> {
                        String body = new String(res.getBody().readAllBytes());
                        log.warn("transcript-service 4xx: {}", body);
                        throw new DomainException(ErrorCode.TRANSCRIPT_FETCH_FAILED, body);
                    })
                    .onStatus(HttpStatusCode::is5xxServerError, (req, res) -> {
                        throw new DomainException(ErrorCode.TRANSCRIPT_FETCH_FAILED, "transcript-service 내부 오류");
                    })
                    .body(TranscriptResponse.class);
        } catch (DomainException e) {
            throw e;
        } catch (RestClientException e) {
            log.error("transcript-service 호출 실패", e);
            throw new DomainException(ErrorCode.TRANSCRIPT_FETCH_FAILED, e.getMessage());
        }
    }
}
