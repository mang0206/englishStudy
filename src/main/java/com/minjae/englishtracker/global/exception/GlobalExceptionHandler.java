package com.minjae.englishtracker.global.exception;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(DomainException.class)
    public ResponseEntity<ErrorResponse> handleDomainException(DomainException e, HttpServletRequest request) {
        log.warn("DomainException: code={}, message={}", e.getErrorCode().getCode(), e.getMessage());
        ErrorCode ec = e.getErrorCode();
        return ResponseEntity.status(ec.getStatus())
                .body(ErrorResponse.of(ec, request.getRequestURI()));
    }

    @ExceptionHandler({MethodArgumentNotValidException.class, MethodArgumentTypeMismatchException.class, IllegalArgumentException.class})
    public ResponseEntity<ErrorResponse> handleBadRequest(Exception e, HttpServletRequest request) {
        log.warn("Bad request: {}", e.getMessage());
        return ResponseEntity.status(ErrorCode.INVALID_INPUT.getStatus())
                .body(ErrorResponse.of(ErrorCode.INVALID_INPUT, e.getMessage(), request.getRequestURI()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnknown(Exception e, HttpServletRequest request) {
        log.error("Unhandled exception", e);
        return ResponseEntity.status(ErrorCode.INTERNAL_SERVER_ERROR.getStatus())
                .body(ErrorResponse.of(ErrorCode.INTERNAL_SERVER_ERROR, request.getRequestURI()));
    }
}
