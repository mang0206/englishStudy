package com.minjae.englishtracker.domain.study.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "selected_sentences")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SelectedSentence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "script_sentence_id", nullable = false)
    private ScriptSentence scriptSentence;

    @Column(name = "study_date", nullable = false)
    private LocalDate studyDate;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "selectedSentence", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ExpansionPractice> practices = new ArrayList<>();

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
