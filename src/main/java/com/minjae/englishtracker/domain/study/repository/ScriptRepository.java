package com.minjae.englishtracker.domain.study.repository;

import com.minjae.englishtracker.domain.study.entity.Script;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ScriptRepository extends JpaRepository<Script, Long> {

    @EntityGraph(attributePaths = {"sentences"})
    Optional<Script> findFirstByVideoIdAndChapterTitleOrderByCreatedAtDesc(String videoId, String chapterTitle);
}