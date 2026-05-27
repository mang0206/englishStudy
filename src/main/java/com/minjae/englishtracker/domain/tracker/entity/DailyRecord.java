package com.minjae.englishtracker.domain.tracker.entity;

import com.minjae.englishtracker.global.enums.StudyBlock;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "daily_records",
        uniqueConstraints = @UniqueConstraint(columnNames = {"study_date", "block"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DailyRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "study_date", nullable = false)
    private LocalDate studyDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StudyBlock block;

    @Column(name = "completed_tasks", nullable = false)
    private int completedTasks;

    @Column(name = "total_tasks", nullable = false)
    private int totalTasks;

    @Column(name = "study_seconds", nullable = false)
    @Builder.Default
    private int studySeconds = 0;

    @Column(length = 1000)
    private String memo;

    public boolean isCompleted() {
        return completedTasks >= totalTasks && totalTasks > 0;
    }
}