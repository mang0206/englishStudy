package com.minjae.englishtracker.domain.study.repository;

import com.minjae.englishtracker.domain.study.entity.Script;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScriptRepository extends JpaRepository<Script, Long> {
}
