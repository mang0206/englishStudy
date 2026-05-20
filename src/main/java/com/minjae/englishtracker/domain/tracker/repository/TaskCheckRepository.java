package com.minjae.englishtracker.domain.tracker.repository;

import com.minjae.englishtracker.domain.tracker.entity.TaskCheck;
import com.minjae.englishtracker.global.enums.StudyBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TaskCheckRepository extends JpaRepository<TaskCheck, Long> {
    List<TaskCheck> findByStudyDateAndBlockOrderByTaskIndex(LocalDate date, StudyBlock block);
    Optional<TaskCheck> findByStudyDateAndBlockAndTaskIndex(LocalDate date, StudyBlock block, int taskIndex);

    @Modifying
    @Query("DELETE FROM TaskCheck t WHERE t.studyDate = :date AND t.block = :block")
    void deleteByStudyDateAndBlock(@Param("date") LocalDate date, @Param("block") StudyBlock block);
}
