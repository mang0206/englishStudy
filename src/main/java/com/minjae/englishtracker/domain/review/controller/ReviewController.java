package com.minjae.englishtracker.domain.review.controller;

import com.minjae.englishtracker.domain.review.dto.ReviewDtos.*;
import com.minjae.englishtracker.domain.review.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/review")
    public String reviewPage() {
        return "review/index";
    }

    @GetMapping("/api/review/list")
    @ResponseBody
    public ResponseEntity<List<ReviewListItem>> list() {
        return ResponseEntity.ok(reviewService.findAllRecent());
    }

    @GetMapping("/api/review/search")
    @ResponseBody
    public ResponseEntity<List<ReviewListItem>> search(@RequestParam(defaultValue = "") String q) {
        return ResponseEntity.ok(reviewService.search(q));
    }

    @GetMapping("/api/review/{id}")
    @ResponseBody
    public ResponseEntity<ReviewDetail> detail(@PathVariable Long id) {
        return ResponseEntity.ok(reviewService.getDetail(id));
    }
}
