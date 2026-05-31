package com.minjae.englishtracker.domain.demo.controller;

import com.minjae.englishtracker.global.infra.transcript.TranscriptClient;
import com.minjae.englishtracker.global.infra.transcript.TranscriptResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/**
 * 데모 모드 컨트롤러.
 *
 * - 영상/챕터 로딩(transcript)만 실제 API를 사용하고,
 *   번역·선택·피드백·사전·복습·트래커는 모두 프론트엔드(demo-data.js)에서 하드코딩으로 처리한다.
 * - 따라서 여기서는 "뷰 라우팅"과 "실제로 살려둘 transcript 프록시"만 제공한다.
 */
@Controller
@RequiredArgsConstructor
@RequestMapping("/demo")
public class DemoController {

    private final TranscriptClient transcriptClient;

    // ─────────────── 뷰 라우팅 ───────────────

    @GetMapping({"", "/study"})
    public String study() {
        return "demo/study";
    }

    @GetMapping("/study/expansion")
    public String expansion() {
        return "demo/expansion";
    }

    @GetMapping("/study/prompt")
    public String prompt() {
        return "demo/prompt";
    }

    @GetMapping("/review")
    public String review() {
        return "demo/review";
    }

    @GetMapping("/tracker/{date}")
    public String tracker(@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                          org.springframework.ui.Model model) {
        // 트래커는 날짜 라우팅만 실제로 받고, 통계 데이터 자체는 demo-data.js가 그림
        model.addAttribute("date", date);
        return "demo/tracker";
    }

    @GetMapping("/tracker")
    public String trackerRoot() {
        return "redirect:/demo/tracker/" + LocalDate.now();
    }

    // ─────────────── 실제로 살려두는 단 하나의 API: transcript ───────────────

    /**
     * 데모에서도 영상 챕터/자막은 진짜로 가져온다.
     * study.js의 loadVideoAndChapters()가 데모 모드일 때 이 엔드포인트를 호출하도록 한다.
     * (기존 /api/transcript/{videoId}를 그대로 써도 되지만, 데모 경로를 명시적으로 분리)
     */
    @GetMapping("/api/transcript/{videoId}")
    @ResponseBody
    public ResponseEntity<TranscriptResponse> transcript(@PathVariable String videoId) {
        return ResponseEntity.ok(transcriptClient.fetchTranscript(videoId));
    }
}