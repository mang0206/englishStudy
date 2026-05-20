package com.minjae.englishtracker.global.infra.redis;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class SentenceSelectedPublisher {

    private final RedisTemplate<String, Object> redisTemplate;

    @Value("${app.redis.channel.sentence-selected}")
    private String channel;

    public void publish(SentenceSelectedEvent event) {
        log.debug("Publishing sentence-selected event: id={}", event.getId());
        redisTemplate.convertAndSend(channel, event);
    }
}
