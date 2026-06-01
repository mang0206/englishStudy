package com.minjae.englishtracker.domain.study.repository;

import com.minjae.englishtracker.domain.study.entity.SelectedSentence;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface SelectedSentenceRepository extends JpaRepository<SelectedSentence, Long> {

    @EntityGraph(attributePaths = {"scriptSentence", "practices"})
    List<SelectedSentence> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"scriptSentence", "practices"})
    Optional<SelectedSentence> findWithDetailsById(Long id);

    @EntityGraph(attributePaths = {"scriptSentence"})
    List<SelectedSentence> findByIdIn(List<Long> ids);

    @EntityGraph(attributePaths = {"scriptSentence"})
    List<SelectedSentence> findByStudyDateOrderByCreatedAtAsc(LocalDate studyDate);
}
