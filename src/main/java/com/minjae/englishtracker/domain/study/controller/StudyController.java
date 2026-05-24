package com.minjae.englishtracker.domain.study.controller;

import com.minjae.englishtracker.domain.study.dto.ExpansionDtos.*;
import com.minjae.englishtracker.domain.study.dto.StudyDtos.*;
import com.minjae.englishtracker.domain.study.service.StudyService;
import com.minjae.englishtracker.global.infra.transcript.TranscriptClient;
import com.minjae.englishtracker.global.infra.transcript.TranscriptResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@Controller
@RequiredArgsConstructor
public class StudyController {

    private final StudyService studyService;
    private final TranscriptClient transcriptClient;

    @GetMapping("/study")
    public String studyPage() {
        return "study/index";
    }

    @GetMapping("/study/expansion")
    public String expansionPage() {
        return "study/expansion";
    }

    @GetMapping("/study/prompt")
    public String promptPage() {
        return "study/prompt";
    }

    @GetMapping("/api/transcript/{videoId}")
    @ResponseBody
    public ResponseEntity<TranscriptResponse> transcript(@PathVariable String videoId) {
        return ResponseEntity.ok(transcriptClient.fetchTranscript(videoId));
    }

    @PostMapping("/api/script/translate")
    @ResponseBody
    public ResponseEntity<TranslateResponse> translate(@RequestBody TranslateRequest req) {
        return ResponseEntity.ok(studyService.translateAndSave(req.getRawScript(), LocalDate.now()));
    }

    @PostMapping("/api/sentence/select")
    @ResponseBody
    public ResponseEntity<SelectSentencesResponse> select(@RequestBody SelectSentencesRequest req) {
        return ResponseEntity.ok(studyService.selectSentences(req.getSentenceIds(), LocalDate.now()));
    }

    @PostMapping("/api/expansion/feedback")
    @ResponseBody
    public ResponseEntity<FeedbackResponse> feedback(@RequestBody FeedbackRequest req) {
        return ResponseEntity.ok(studyService.generateFeedback(
                req.getSelectedSentenceId(), req.getExpansions(), LocalDate.now()));
    }

    @PostMapping("/api/sentence/by-ids")
    @ResponseBody
    public ResponseEntity<List<SelectedSentenceDto>> getByIds(@RequestBody List<Long> ids) {
        return ResponseEntity.ok(studyService.getSelectedByIds(ids));
    }
}
