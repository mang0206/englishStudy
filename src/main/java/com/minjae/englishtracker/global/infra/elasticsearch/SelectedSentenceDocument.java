package com.minjae.englishtracker.global.infra.elasticsearch;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

import java.time.LocalDate;

@Document(indexName = "selected_sentences")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SelectedSentenceDocument {

    @Id
    private Long id;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String englishText;

    @Field(type = FieldType.Date, format = {}, pattern = "yyyy-MM-dd")
    private LocalDate studyDate;
}
