package com.minjae.englishtracker.domain.tracker.entity;

import com.minjae.englishtracker.global.enums.StudyBlock;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "task_checks",
       uniqueConstraints = @UniqueConstraint(columnNames = {"study_date", "block", "task_index"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TaskCheck {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "study_date", nullable = false)
    private LocalDate studyDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StudyBlock block;

    @Column(name = "task_index", nullable = false)
    private int taskIndex;

    @Column(nullable = false)
    private boolean checked;
}
