package com.minjae.englishtracker.domain.tracker.dto;

import com.minjae.englishtracker.global.enums.StudyBlock;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

public class TrackerDtos {

    @Getter @Builder
    public static class BlockViewDto {
        private StudyBlock block;
        private String displayName;
        private String icon;
        private String timeLabel;
        private List<String> taskLabels;
        private List<Boolean> taskChecks;
        private String memo;
        private int completedTasks;
        private int totalTasks;
        private int progressPercent;
    }

    @Getter @Builder
    public static class WeekDayDto {
        private LocalDate date;
        private String dayName;
        private boolean today;
        private boolean future;
        private boolean fullDone;
        private boolean partialDone;
    }

    @Getter @Builder
    public static class DayViewDto {
        private LocalDate date;
        private List<BlockViewDto> blocks;
        private int totalTasks;
        private int completedTasks;
        private int totalStudySeconds;
        private int streakDays;
        private List<WeekDayDto> weekDays;

        public int getProgressPercent() {
            if (totalTasks == 0) return 0;
            return (int) Math.round((double) completedTasks / totalTasks * 100);
        }

        public String getStudyTimeLabel() {
            int total = totalStudySeconds;
            int h = total / 3600;
            int m = (total % 3600) / 60;
            if (h > 0) return h + "시간 " + m + "분";
            if (m > 0) return m + "분";
            return total + "초";
        }
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class StudyTimeRequest {
        private Integer seconds;
    }
}