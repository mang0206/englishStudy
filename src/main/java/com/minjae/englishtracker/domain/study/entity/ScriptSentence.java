package com.minjae.englishtracker.domain.study.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "script_sentences")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ScriptSentence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "script_id", nullable = false)
    private Script script;

    @Column(nullable = false)
    private int seq;

    @Column(name = "english_text", columnDefinition = "TEXT", nullable = false)
    private String englishText;

    @Column(name = "korean_text", columnDefinition = "TEXT")
    private String koreanText;
}
