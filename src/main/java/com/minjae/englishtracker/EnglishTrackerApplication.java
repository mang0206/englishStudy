package com.minjae.englishtracker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.data.elasticsearch.ReactiveElasticsearchRepositoriesAutoConfiguration;
import org.springframework.boot.autoconfigure.elasticsearch.ReactiveElasticsearchClientAutoConfiguration;

@SpringBootApplication(exclude = {
    ReactiveElasticsearchRepositoriesAutoConfiguration.class,
    ReactiveElasticsearchClientAutoConfiguration.class
})
public class EnglishTrackerApplication {
    public static void main(String[] args) {
        SpringApplication.run(EnglishTrackerApplication.class, args);
    }
}
