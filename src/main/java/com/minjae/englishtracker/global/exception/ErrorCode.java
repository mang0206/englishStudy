package com.minjae.englishtracker.global.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    // 공통
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "C001", "내부 서버 오류가 발생했습니다."),
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "C002", "잘못된 입력값입니다."),
    RESOURCE_NOT_FOUND(HttpStatus.NOT_FOUND, "C003", "요청한 리소스를 찾을 수 없습니다."),

    // Study
    SCRIPT_NOT_FOUND(HttpStatus.NOT_FOUND, "S001", "스크립트를 찾을 수 없습니다."),
    SCRIPT_SENTENCE_NOT_FOUND(HttpStatus.NOT_FOUND, "S002", "스크립트 문장을 찾을 수 없습니다."),
    SELECTED_SENTENCE_NOT_FOUND(HttpStatus.NOT_FOUND, "S003", "선택한 문장을 찾을 수 없습니다."),
    INVALID_SELECTION_COUNT(HttpStatus.BAD_REQUEST, "S004", "문장은 3~5개를 선택해야 합니다."),
    EMPTY_SCRIPT(HttpStatus.BAD_REQUEST, "S005", "스크립트가 비어있습니다."),

    // Tracker
    INVALID_TASK_INDEX(HttpStatus.BAD_REQUEST, "T001", "유효하지 않은 태스크 인덱스입니다."),

    // AI
    AI_PARSING_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "A001", "AI 응답 파싱에 실패했습니다."),
    AI_CALL_FAILED(HttpStatus.SERVICE_UNAVAILABLE, "A002", "AI 호출에 실패했습니다.");

    private final HttpStatus status;
    private final String code;
    private final String message;

    ErrorCode(HttpStatus status, String code, String message) {
        this.status = status;
        this.code = code;
        this.message = message;
    }
}
