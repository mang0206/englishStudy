package com.minjae.englishtracker.global.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.elasticsearch.repository.config.EnableElasticsearchRepositories;

/**
 * Elasticsearch Repository 스캔 범위를 infra.elasticsearch 패키지로 한정
 * JPA Repository와의 충돌 방지.
 */
@Configuration
@EnableElasticsearchRepositories(basePackages = "com.minjae.englishtracker.global.infra.elasticsearch")
public class ElasticsearchConfig {
}