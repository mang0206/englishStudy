package com.minjae.englishtracker.domain.study.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "scripts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Script {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "study_date", nullable = false)
    private LocalDate studyDate;

    @Column(name = "raw_input", columnDefinition = "TEXT")
    private String rawInput;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "script", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ScriptSentence> sentences = new ArrayList<>();

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
