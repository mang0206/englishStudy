package com.minjae.englishtracker.global.infra.redis;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.minjae.englishtracker.global.infra.elasticsearch.SelectedSentenceDocument;
import com.minjae.englishtracker.global.infra.elasticsearch.SelectedSentenceSearchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class SentenceSelectedSubscriber implements MessageListener {

    private final ObjectMapper redisObjectMapper;
    private final SelectedSentenceSearchRepository searchRepository;

    @Override
    public void onMessage(Message message, byte[] pattern) {
        try {
            String json = new String(message.getBody());
            SentenceSelectedEvent event = redisObjectMapper.readValue(json, SentenceSelectedEvent.class);

            SelectedSentenceDocument doc = SelectedSentenceDocument.builder()
                    .id(event.getId())
                    .englishText(event.getEnglishText())
                    .studyDate(event.getStudyDate())
                    .build();

            searchRepository.save(doc);
            log.info("Indexed sentence to ES: id={}", event.getId());
        } catch (Exception e) {
            // 구독자 콜백에서 예외 던지면 다른 메시지 수신에 영향 → 로깅만
            log.error("Failed to index sentence to ES", e);
        }
    }
}
