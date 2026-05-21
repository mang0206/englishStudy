package com.minjae.englishtracker.global.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/**
 * JPA Repository 스캔 범위를 도메인 패키지로 한정
 * Spring Data JPA + Elasticsearch 동시 사용 시 리포지토리 식별 충돌 방지.
 */
@Configuration
@EnableJpaRepositories(basePackages = "com.minjae.englishtracker.domain")
public class JpaConfig {
}