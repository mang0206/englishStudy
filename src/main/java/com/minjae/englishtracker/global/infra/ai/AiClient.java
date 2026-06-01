package com.minjae.englishtracker.global.infra.ai;

import com.minjae.englishtracker.global.exception.DomainException;
import com.minjae.englishtracker.global.exception.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.google.genai.GoogleGenAiChatOptions;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class AiClient {

    private final ChatClient chatClient;

    public AiClient(ChatModel chatModel) {
        this.chatClient = ChatClient.builder(chatModel).build();
    }

    /** 기본 모델(yml 설정) 사용 */
    public String generate(String prompt) {
        return call(prompt, null, null);
    }

    /** 모델을 런타임에 지정 (temperature 등 나머지 옵션은 yml 기본값 병합 유지) */
    public String generate(String prompt, String model) {
        return call(prompt, model, null);
    }

    public String generate(String prompt, String model, Double temperature) {
        return call(prompt, model, temperature);
    }

    private String call(String prompt, String model, Double temperature) {
        try {
            var spec = chatClient.prompt().user(prompt);

            boolean hasModel = (model != null && !model.isBlank());
            boolean hasTemp = (temperature != null);

            if (hasModel || hasTemp) {
                var builder = GoogleGenAiChatOptions.builder();
                if (hasModel) builder.model(model);
                if (hasTemp)  builder.temperature(temperature);
                spec = spec.options(builder.build());
            }

            String content = spec.call().content();
            return stripCodeFence(content);
        } catch (Exception e) {
            log.error("AI call failed (model={})", model, e);
            throw new DomainException(ErrorCode.AI_CALL_FAILED, e);
        }
    }

    private String stripCodeFence(String text) {
        if (text == null) return "";
        return text.replaceAll("```json", "").replaceAll("```", "").trim();
    }
}