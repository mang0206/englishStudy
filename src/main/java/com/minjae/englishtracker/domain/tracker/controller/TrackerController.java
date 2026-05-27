package com.minjae.englishtracker.domain.tracker.controller;

import com.minjae.englishtracker.domain.tracker.dto.TrackerDtos.DayViewDto;
import com.minjae.englishtracker.domain.tracker.dto.TrackerDtos.StudyTimeRequest;
import com.minjae.englishtracker.domain.tracker.service.TrackerService;
import com.minjae.englishtracker.global.enums.StudyBlock;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class TrackerController {

    private final TrackerService trackerService;

    @GetMapping("/")
    public String root() {
        return "redirect:/tracker/" + LocalDate.now();
    }

    @GetMapping("/tracker/{date}")
    public String dayView(@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                          Model model) {
        DayViewDto dayView = trackerService.getDayView(date);
        model.addAttribute("day", dayView);
        model.addAttribute("today", LocalDate.now());
        return "tracker/day";
    }

    @PostMapping("/api/task/toggle")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> toggleTask(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam StudyBlock block,
            @RequestParam int taskIndex) {
        trackerService.toggleTask(date, block, taskIndex);
        DayViewDto updated = trackerService.getDayView(date);

        var blockDto = updated.getBlocks().stream()
                .filter(b -> b.getBlock() == block).findFirst().orElseThrow();

        return ResponseEntity.ok(Map.of(
                "blockDone", blockDto.getCompletedTasks(),
                "blockTotal", blockDto.getTotalTasks(),
                "blockPercent", blockDto.getProgressPercent(),
                "totalDone", updated.getCompletedTasks(),
                "totalTasks", updated.getTotalTasks(),
                "totalPercent", updated.getProgressPercent(),
                "streak", updated.getStreakDays(),
                "taskChecks", blockDto.getTaskChecks()
        ));
    }

    @PostMapping("/api/memo/save")
    @ResponseBody
    public ResponseEntity<Void> saveMemo(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam StudyBlock block,
            @RequestParam(defaultValue = "") String memo) {
        trackerService.saveMemo(date, block, memo);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/api/day/reset")
    @ResponseBody
    public ResponseEntity<Void> resetDay(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        trackerService.resetDay(date);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/api/tracker/study-time")
    @ResponseBody
    public ResponseEntity<Void> addStudyTime(@RequestBody StudyTimeRequest req) {
        trackerService.addStudySeconds(LocalDate.now(), StudyBlock.EXPANSION, req.getSeconds());
        return ResponseEntity.ok().build();
    }
}
