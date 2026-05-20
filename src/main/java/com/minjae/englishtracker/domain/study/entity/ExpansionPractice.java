package com.minjae.englishtracker.domain.study.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "expansion_practices",
       uniqueConstraints = @UniqueConstraint(columnNames = {"selected_sentence_id", "expansion_type"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ExpansionPractice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "selected_sentence_id", nullable = false)
    private SelectedSentence selectedSentence;

    @Enumerated(EnumType.STRING)
    @Column(name = "expansion_type", nullable = false)
    private ExpansionType expansionType;

    @Column(name = "user_input", columnDefinition = "TEXT")
    private String userInput;

    @Column(name = "feedback_text", columnDefinition = "TEXT")
    private String feedbackText;

    @Column(name = "is_correct")
    private boolean correct;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
