package com.minjae.englishtracker.domain.tracker.repository;

import com.minjae.englishtracker.domain.tracker.entity.DailyRecord;
import com.minjae.englishtracker.global.enums.StudyBlock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DailyRecordRepository extends JpaRepository<DailyRecord, Long> {
    List<DailyRecord> findByStudyDateOrderByBlock(LocalDate studyDate);
    Optional<DailyRecord> findByStudyDateAndBlock(LocalDate studyDate, StudyBlock block);
}
