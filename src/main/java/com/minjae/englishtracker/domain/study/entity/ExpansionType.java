package com.minjae.englishtracker.domain.study.entity;

public enum ExpansionType {
    NEGATIVE("부정형"),
    PAST("과거형"),
    FUTURE("미래형"),
    QUESTION("질문형"),
    REASON("이유 추가"),
    CONDITION("조건");

    private final String displayName;

    ExpansionType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
