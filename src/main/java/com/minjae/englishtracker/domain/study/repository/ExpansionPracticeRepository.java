package com.minjae.englishtracker.domain.study.repository;

import com.minjae.englishtracker.domain.study.entity.ExpansionPractice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExpansionPracticeRepository extends JpaRepository<ExpansionPractice, Long> {
    List<ExpansionPractice> findBySelectedSentenceId(Long selectedSentenceId);
}
