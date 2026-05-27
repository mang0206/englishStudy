package com.minjae.englishtracker.domain.tracker.service;

import com.minjae.englishtracker.domain.tracker.dto.TrackerDtos.*;
import com.minjae.englishtracker.domain.tracker.entity.DailyRecord;
import com.minjae.englishtracker.domain.tracker.entity.TaskCheck;
import com.minjae.englishtracker.domain.tracker.repository.DailyRecordRepository;
import com.minjae.englishtracker.domain.tracker.repository.TaskCheckRepository;
import com.minjae.englishtracker.global.enums.StudyBlock;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class TrackerService {

    private final DailyRecordRepository dailyRecordRepository;
    private final TaskCheckRepository taskCheckRepository;

    @Transactional(readOnly = true)
    public DayViewDto getDayView(LocalDate date) {
        List<BlockViewDto> blocks = new ArrayList<>();
        int totalTasks = 0, completedTasks = 0, totalStudySeconds = 0;

        for (StudyBlock block : StudyBlock.values()) {
            List<String> taskLabels = TaskDefinition.get(block);
            List<TaskCheck> checks = taskCheckRepository.findByStudyDateAndBlockOrderByTaskIndex(date, block);

            List<Boolean> taskChecks = new ArrayList<>();
            for (int i = 0; i < taskLabels.size(); i++) {
                int idx = i;
                boolean checked = checks.stream()
                        .filter(c -> c.getTaskIndex() == idx)
                        .findFirst()
                        .map(TaskCheck::isChecked)
                        .orElse(false);
                taskChecks.add(checked);
            }

            int done = (int) taskChecks.stream().filter(Boolean::booleanValue).count();
            int total = taskLabels.size();
            int pct = total > 0 ? (int) Math.round((double) done / total * 100) : 0;

            DailyRecord dr = dailyRecordRepository.findByStudyDateAndBlock(date, block).orElse(null);
            String memo = dr != null ? dr.getMemo() : "";
            int blockSeconds = dr != null ? dr.getStudySeconds() : 0;

            blocks.add(BlockViewDto.builder()
                    .block(block)
                    .displayName(block.getDisplayName())
                    .icon(block.getIcon())
                    .timeLabel(block.getTimeLabel())
                    .taskLabels(taskLabels)
                    .taskChecks(taskChecks)
                    .memo(memo)
                    .completedTasks(done)
                    .totalTasks(total)
                    .progressPercent(pct)
                    .build());

            totalTasks += total;
            completedTasks += done;
            totalStudySeconds += blockSeconds;
        }

        return DayViewDto.builder()
                .date(date)
                .blocks(blocks)
                .totalTasks(totalTasks)
                .completedTasks(completedTasks)
                .totalStudySeconds(totalStudySeconds)
                .streakDays(calcStreak(date))
                .weekDays(buildWeekDays(date))
                .build();
    }

    @Transactional
    public void toggleTask(LocalDate date, StudyBlock block, int taskIndex) {
        Optional<TaskCheck> existing = taskCheckRepository
                .findByStudyDateAndBlockAndTaskIndex(date, block, taskIndex);

        if (existing.isPresent()) {
            TaskCheck tc = existing.get();
            tc.setChecked(!tc.isChecked());
            taskCheckRepository.save(tc);
        } else {
            taskCheckRepository.save(TaskCheck.builder()
                    .studyDate(date).block(block).taskIndex(taskIndex).checked(true).build());
        }
        syncDailyRecord(date, block);
    }

    @Transactional
    public void saveMemo(LocalDate date, StudyBlock block, String memo) {
        DailyRecord record = dailyRecordRepository
                .findByStudyDateAndBlock(date, block)
                .orElseGet(() -> DailyRecord.builder()
                        .studyDate(date).block(block).completedTasks(0)
                        .totalTasks(TaskDefinition.count(block)).build());
        record.setMemo(memo);
        dailyRecordRepository.save(record);
    }

    @Transactional
    public void resetDay(LocalDate date) {
        for (StudyBlock block : StudyBlock.values()) {
            taskCheckRepository.deleteByStudyDateAndBlock(date, block);
            dailyRecordRepository.findByStudyDateAndBlock(date, block).ifPresent(r -> {
                r.setCompletedTasks(0);
                r.setMemo("");
                r.setStudySeconds(0);
                dailyRecordRepository.save(r);
            });
        }
    }

    /**
     * study 도메인에서 호출하는 외부 API:
     * 학습 단계 완료 시 해당 블록의 모든 태스크를 완료 상태로 만든다.
     */
    @Transactional
    public void autoCompleteBlock(LocalDate date, StudyBlock block) {
        int count = TaskDefinition.count(block);
        for (int i = 0; i < count; i++) {
            int idx = i;
            taskCheckRepository.findByStudyDateAndBlockAndTaskIndex(date, block, idx)
                    .ifPresentOrElse(
                            tc -> { tc.setChecked(true); taskCheckRepository.save(tc); },
                            () -> taskCheckRepository.save(TaskCheck.builder()
                                    .studyDate(date).block(block).taskIndex(idx).checked(true).build())
                    );
        }
        syncDailyRecord(date, block);
    }

    /**
     * 학습 사이클 완료 시 누적된 시간(초)을 해당 블록에 더한다.
     */
    @Transactional
    public void addStudySeconds(LocalDate date, StudyBlock block, int seconds) {
        if (seconds <= 0) return;

        DailyRecord record = dailyRecordRepository.findByStudyDateAndBlock(date, block)
                .orElseGet(() -> DailyRecord.builder()
                        .studyDate(date)
                        .block(block)
                        .completedTasks(0)
                        .totalTasks(TaskDefinition.count(block))
                        .build());

        record.setStudySeconds(record.getStudySeconds() + seconds);
        dailyRecordRepository.save(record);
    }

    private void syncDailyRecord(LocalDate date, StudyBlock block) {
        List<TaskCheck> checks = taskCheckRepository.findByStudyDateAndBlockOrderByTaskIndex(date, block);
        int done = (int) checks.stream().filter(TaskCheck::isChecked).count();
        int total = TaskDefinition.count(block);

        DailyRecord record = dailyRecordRepository.findByStudyDateAndBlock(date, block)
                .orElseGet(() -> DailyRecord.builder()
                        .studyDate(date).block(block).totalTasks(total).build());
        record.setCompletedTasks(done);
        record.setTotalTasks(total);
        dailyRecordRepository.save(record);
    }

    private int calcStreak(LocalDate from) {
        int streak = 0;
        LocalDate d = from;
        while (true) {
            List<DailyRecord> records = dailyRecordRepository.findByStudyDateOrderByBlock(d);
            if (records.isEmpty()) break;
            boolean hasAny = records.stream().anyMatch(r -> r.getCompletedTasks() > 0);
            if (!hasAny) break;
            streak++;
            d = d.minusDays(1);
            if (streak > 365) break;
        }
        return streak;
    }

    private List<WeekDayDto> buildWeekDays(LocalDate date) {
        LocalDate today = LocalDate.now();
        LocalDate monday = date.with(DayOfWeek.MONDAY);
        String[] dayNames = {"월", "화", "수", "목", "금", "토", "일"};
        List<WeekDayDto> result = new ArrayList<>();

        for (int i = 0; i < 7; i++) {
            LocalDate d = monday.plusDays(i);
            List<DailyRecord> records = dailyRecordRepository.findByStudyDateOrderByBlock(d);
            int done = records.stream().mapToInt(DailyRecord::getCompletedTasks).sum();
            boolean fullDone = !records.isEmpty() && records.stream().allMatch(DailyRecord::isCompleted);
            boolean partial = !fullDone && done > 0;

            result.add(WeekDayDto.builder()
                    .date(d).dayName(dayNames[i])
                    .today(d.equals(today))
                    .future(d.isAfter(today))
                    .fullDone(fullDone).partialDone(partial).build());
        }
        return result;
    }
}