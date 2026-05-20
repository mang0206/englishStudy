package com.minjae.englishtracker.global.infra.elasticsearch;

import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

import java.util.List;

public interface SelectedSentenceSearchRepository extends ElasticsearchRepository<SelectedSentenceDocument, Long> {
    List<SelectedSentenceDocument> findByEnglishTextContaining(String keyword);
}
