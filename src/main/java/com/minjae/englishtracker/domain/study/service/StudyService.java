package com.minjae.englishtracker.domain.study.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.minjae.englishtracker.domain.study.dto.ExpansionDtos.*;
import com.minjae.englishtracker.domain.study.dto.StudyDtos.*;
import com.minjae.englishtracker.domain.study.entity.*;
import com.minjae.englishtracker.domain.study.repository.*;
import com.minjae.englishtracker.domain.tracker.service.TrackerService;
import com.minjae.englishtracker.global.enums.StudyBlock;
import com.minjae.englishtracker.global.exception.DomainException;
import com.minjae.englishtracker.global.exception.ErrorCode;
import com.minjae.englishtracker.global.infra.ai.AiClient;
import com.minjae.englishtracker.global.infra.redis.SentenceSelectedEvent;
import com.minjae.englishtracker.global.infra.redis.SentenceSelectedPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

import com.minjae.englishtracker.domain.study.dto.DictionaryDtos.*;


@Slf4j
@Service
@RequiredArgsConstructor
public class StudyService {

    private final ScriptRepository scriptRepository;
    private final ScriptSentenceRepository scriptSentenceRepository;
    private final SelectedSentenceRepository selectedSentenceRepository;
    private final ExpansionPracticeRepository expansionPracticeRepository;
    private final AiClient aiClient;
    private final SentenceSelectedPublisher publisher;
    private final TrackerService trackerService;
    private final ObjectMapper objectMapper;

    @Transactional
    public TranslateResponse translateAndSave(String rawScript, String videoId, String chapterTitle, LocalDate date) {
        if (rawScript == null || rawScript.isBlank()) {
            throw new DomainException(ErrorCode.EMPTY_SCRIPT);
        }

        // 1. 캐시 체크: videoId + chapterTitle 조합으로 기존 번역 검색
        if (videoId != null && chapterTitle != null) {
            var cached = scriptRepository
                    .findFirstByVideoIdAndChapterTitleOrderByCreatedAtDesc(videoId, chapterTitle);
            if (cached.isPresent()) {
                log.info("Translation cache hit: videoId={}, chapter={}", videoId, chapterTitle);
                Script script = cached.get();
                List<TranslatedSentence> result = script.getSentences().stream()
                        .sorted((a, b) -> Integer.compare(a.getSeq(), b.getSeq()))
                        .map(s -> TranslatedSentence.builder()
                                .sentenceId(s.getId())
                                .english(s.getEnglishText())
                                .korean(s.getKoreanText())
                                .build())
                        .toList();
                return TranslateResponse.builder()
                        .scriptId(script.getId())
                        .sentences(result)
                        .fromCache(true)
                        .build();
            }
        }

        // 2. 캐시 미스: AI 호출
        log.info("Translation cache miss, calling AI: videoId={}, chapter={}", videoId, chapterTitle);
        String prompt = PromptBuilder.translation(rawScript);
        String response = aiClient.generate(prompt);

        Script script = Script.builder()
                .studyDate(date)
                .videoId(videoId)
                .chapterTitle(chapterTitle)
                .rawInput(rawScript)
                .build();

        try {
            JsonNode root = objectMapper.readTree(response);
            JsonNode arr = root.path("sentences");
            int seq = 0;
            for (JsonNode node : arr) {
                ScriptSentence ss = ScriptSentence.builder()
                        .script(script)
                        .seq(seq++)
                        .englishText(node.path("english").asText())
                        .koreanText(node.path("korean").asText())
                        .build();
                script.getSentences().add(ss);
            }
        } catch (Exception e) {
            log.error("AI translation parse failed. raw={}", response, e);
            throw new DomainException(ErrorCode.AI_PARSING_FAILED, e);
        }

        Script saved = scriptRepository.save(script);

        List<TranslatedSentence> result = saved.getSentences().stream()
                .map(s -> TranslatedSentence.builder()
                        .sentenceId(s.getId())
                        .english(s.getEnglishText())
                        .korean(s.getKoreanText())
                        .build())
                .toList();

        return TranslateResponse.builder()
                .scriptId(saved.getId())
                .sentences(result)
                .fromCache(false)
                .build();
    }

    @Transactional
    public SelectSentencesResponse selectSentences(List<Long> sentenceIds, LocalDate date) {
        if (sentenceIds == null || sentenceIds.size() < 3 || sentenceIds.size() > 5) {
            throw new DomainException(ErrorCode.INVALID_SELECTION_COUNT);
        }

        List<SelectedSentenceDto> result = new ArrayList<>();

        for (Long sid : sentenceIds) {
            ScriptSentence ss = scriptSentenceRepository.findById(sid)
                    .orElseThrow(() -> new DomainException(ErrorCode.SCRIPT_SENTENCE_NOT_FOUND, "id=" + sid));

            SelectedSentence saved = selectedSentenceRepository.save(SelectedSentence.builder()
                    .scriptSentence(ss)
                    .studyDate(date)
                    .build());

            // Redis 발행 → ES 색인
            publisher.publish(SentenceSelectedEvent.builder()
                    .id(saved.getId())
                    .englishText(ss.getEnglishText())
                    .studyDate(date)
                    .build());

            result.add(SelectedSentenceDto.builder()
                    .selectedId(saved.getId())
                    .englishText(ss.getEnglishText())
                    .koreanText(ss.getKoreanText())
                    .build());
        }

        // 관리 탭 쉐도잉 블록 자동 체크
        trackerService.autoCompleteBlock(date, StudyBlock.SHADOWING);

        return SelectSentencesResponse.builder().selected(result).build();
    }

    @Transactional
    public FeedbackResponse generateFeedback(Long selectedSentenceId, Map<ExpansionType, String> expansions, LocalDate date) {
        SelectedSentence selected = selectedSentenceRepository.findById(selectedSentenceId)
                .orElseThrow(() -> new DomainException(ErrorCode.SELECTED_SENTENCE_NOT_FOUND));

        String original = selected.getScriptSentence().getEnglishText();
        String prompt = PromptBuilder.expansionFeedback(original, expansions);
        String response = aiClient.generate(prompt);

        List<FeedbackItem> items = new ArrayList<>();
        try {
            JsonNode root = objectMapper.readTree(response);
            JsonNode arr = root.path("results");

            // 기존 practice들을 Map으로 미리 로드 (N+1 방지)
            Map<ExpansionType, ExpansionPractice> existing = expansionPracticeRepository
                    .findBySelectedSentenceId(selectedSentenceId).stream()
                    .collect(java.util.stream.Collectors.toMap(
                            ExpansionPractice::getExpansionType, p -> p, (a, b) -> a));

            for (JsonNode node : arr) {
                ExpansionType type = ExpansionType.valueOf(node.path("type").asText());
                boolean correct = node.path("isCorrect").asBoolean();
                String feedback = node.path("feedback").asText();
                String userInput = expansions.getOrDefault(type, "");

                ExpansionPractice practice = existing.getOrDefault(type,
                        ExpansionPractice.builder()
                                .selectedSentence(selected)
                                .expansionType(type)
                                .build());
                practice.setUserInput(userInput);
                practice.setFeedbackText(feedback);
                practice.setCorrect(correct);
                expansionPracticeRepository.save(practice);

                items.add(FeedbackItem.builder()
                        .type(type).userInput(userInput)
                        .correct(correct).feedback(feedback).build());
            }
        } catch (Exception e) {
            log.error("AI feedback parse failed. raw={}", response, e);
            throw new DomainException(ErrorCode.AI_PARSING_FAILED, e);
        }

        // 관리 탭 문장 확장 블록 자동 체크
        trackerService.autoCompleteBlock(date, StudyBlock.EXPANSION);

        return FeedbackResponse.builder().results(items).build();
    }

    @Transactional(readOnly = true)
    public List<SelectedSentenceDto> getSelectedByIds(List<Long> ids) {
        return selectedSentenceRepository.findByIdIn(ids).stream()
                .map(s -> SelectedSentenceDto.builder()
                        .selectedId(s.getId())
                        .englishText(s.getScriptSentence().getEnglishText())
                        .koreanText(s.getScriptSentence().getKoreanText())
                        .build())
                .toList();
    }

    public DictionaryResponse lookupDictionary(String koreanWord) {
        if (koreanWord == null || koreanWord.isBlank()) {
            throw new DomainException(ErrorCode.EMPTY_SCRIPT, "검색할 단어를 입력해주세요");
        }

        String prompt = PromptBuilder.dictionary(koreanWord.trim());
        String response = aiClient.generate(prompt);

        try {
            JsonNode root = objectMapper.readTree(response);
            JsonNode arr = root.path("translations");
            List<Translation> translations = new ArrayList<>();
            for (JsonNode node : arr) {
                translations.add(Translation.builder()
                        .english(node.path("english").asText())
                        .pos(node.path("pos").asText())
                        .nuance(node.path("nuance").asText())
                        .example(node.path("example").asText())
                        .exampleKorean(node.path("exampleKorean").asText())
                        .build());
            }
            return DictionaryResponse.builder()
                    .query(koreanWord)
                    .translations(translations)
                    .build();
        } catch (Exception e) {
            log.error("Dictionary parse failed. raw={}", response, e);
            throw new DomainException(ErrorCode.AI_PARSING_FAILED, e);
        }
    }
}
