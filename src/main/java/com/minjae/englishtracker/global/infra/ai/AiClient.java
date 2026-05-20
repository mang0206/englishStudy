package com.minjae.englishtracker.global.infra.ai;

import com.minjae.englishtracker.global.exception.DomainException;
import com.minjae.englishtracker.global.exception.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.stereotype.Component;

/**
 * Spring AI ChatClient 래퍼.
 *
 * 실제 Provider(Google GenAI, OpenAI, Anthropic 등)는 yml 설정으로 결정되며,
 * 본 클래스는 도메인 코드가 특정 Provider에 결합되지 않도록 추상화 계층을 제공한다.
 */
@Slf4j
@Component
public class AiClient {

    private final ChatClient chatClient;

    public AiClient(ChatModel chatModel) {
        this.chatClient = ChatClient.builder(chatModel).build();
    }

    /**
     * 프롬프트를 보내고 텍스트 응답을 받는다.
     */
    public String generate(String prompt) {
        try {
            String content = chatClient.prompt()
                    .user(prompt)
                    .call()
                    .content();
            return stripCodeFence(content);
        } catch (Exception e) {
            log.error("AI call failed", e);
            throw new DomainException(ErrorCode.AI_CALL_FAILED, e);
        }
    }

    /**
     * Gemini가 종종 ```json ... ``` 형식으로 응답하는 경우를 위해 보정.
     */
    private String stripCodeFence(String text) {
        if (text == null) return "";
        return text.replaceAll("```json", "").replaceAll("```", "").trim();
    }
}
