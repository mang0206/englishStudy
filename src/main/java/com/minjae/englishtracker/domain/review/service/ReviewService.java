package com.minjae.englishtracker.domain.review.service;

import com.minjae.englishtracker.domain.review.dto.ReviewDtos.*;
import com.minjae.englishtracker.domain.study.entity.ExpansionPractice;
import com.minjae.englishtracker.domain.study.entity.ExpansionType;
import com.minjae.englishtracker.domain.study.entity.SelectedSentence;
import com.minjae.englishtracker.domain.study.repository.SelectedSentenceRepository;
import com.minjae.englishtracker.global.exception.DomainException;
import com.minjae.englishtracker.global.exception.ErrorCode;
import com.minjae.englishtracker.global.infra.elasticsearch.SelectedSentenceDocument;
import com.minjae.englishtracker.global.infra.elasticsearch.SelectedSentenceSearchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewService {

    private final SelectedSentenceRepository selectedSentenceRepository;
    private final SelectedSentenceSearchRepository searchRepository;

    @Transactional(readOnly = true)
    public List<ReviewListItem> findAllRecent() {
        return selectedSentenceRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toListItem)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReviewListItem> search(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return findAllRecent();
        }
        try {
            List<SelectedSentenceDocument> docs = searchRepository.findByEnglishTextContaining(keyword);
            List<Long> ids = docs.stream().map(SelectedSentenceDocument::getId).toList();
            if (ids.isEmpty()) return Collections.emptyList();

            Map<Long, SelectedSentence> byId = selectedSentenceRepository.findByIdIn(ids).stream()
                    .collect(Collectors.toMap(SelectedSentence::getId, s -> s));

            return ids.stream()
                    .map(byId::get)
                    .filter(Objects::nonNull)
                    .map(this::toListItem)
                    .toList();
        } catch (Exception e) {
            // ES 장애 시 DB 폴백
            log.warn("ES search failed, falling back to DB scan: {}", e.getMessage());
            String lower = keyword.toLowerCase();
            return selectedSentenceRepository.findAllByOrderByCreatedAtDesc().stream()
                    .filter(s -> s.getScriptSentence().getEnglishText().toLowerCase().contains(lower))
                    .map(this::toListItem)
                    .toList();
        }
    }

    @Transactional(readOnly = true)
    public ReviewDetail getDetail(Long selectedId) {
        SelectedSentence s = selectedSentenceRepository.findWithDetailsById(selectedId)
                .orElseThrow(() -> new DomainException(ErrorCode.SELECTED_SENTENCE_NOT_FOUND));

        Map<ExpansionType, ExpansionPractice> byType = s.getPractices().stream()
                .collect(Collectors.toMap(ExpansionPractice::getExpansionType, p -> p, (a, b) -> a));

        List<ExpansionDetail> expansions = Arrays.stream(ExpansionType.values())
                .map(type -> {
                    ExpansionPractice p = byType.get(type);
                    return ExpansionDetail.builder()
                            .type(type)
                            .typeName(type.getDisplayName())
                            .userInput(p == null ? "" : p.getUserInput())
                            .feedbackText(p == null ? "" : p.getFeedbackText())
                            .correct(p != null && p.isCorrect())
                            .build();
                })
                .toList();

        return ReviewDetail.builder()
                .selectedId(s.getId())
                .englishText(s.getScriptSentence().getEnglishText())
                .koreanText(s.getScriptSentence().getKoreanText())
                .studyDate(s.getStudyDate())
                .expansions(expansions)
                .build();
    }

    private ReviewListItem toListItem(SelectedSentence s) {
        int correctCount = (int) s.getPractices().stream().filter(ExpansionPractice::isCorrect).count();
        return ReviewListItem.builder()
                .selectedId(s.getId())
                .studyDate(s.getStudyDate())
                .englishText(s.getScriptSentence().getEnglishText())
                .correctCount(correctCount)
                .build();
    }
}
