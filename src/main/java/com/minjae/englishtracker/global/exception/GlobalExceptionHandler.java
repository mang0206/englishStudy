package com.minjae.englishtracker.global.exception;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.ui.Model;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@Slf4j
@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<Void> handleNoResource(NoResourceFoundException ex) {
        return ResponseEntity.notFound().build();
    }

    @ExceptionHandler(DomainException.class)
    public Object handleDomainException(DomainException e, HttpServletRequest request, Model model) {
        log.warn("DomainException: code={}, message={}", e.getErrorCode().getCode(), e.getMessage());
        ErrorCode ec = e.getErrorCode();

        if (isApiRequest(request)) {
            return ResponseEntity.status(ec.getStatus())
                    .body(ErrorResponse.of(ec, request.getRequestURI()));
        }
        return renderErrorPage(ec, e.getMessage(), request);
    }

    @ExceptionHandler({MethodArgumentNotValidException.class, MethodArgumentTypeMismatchException.class, IllegalArgumentException.class})
    public Object handleBadRequest(Exception e, HttpServletRequest request, Model model) {
        log.warn("Bad request: {}", e.getMessage());
        if (isApiRequest(request)) {
            return ResponseEntity.status(ErrorCode.INVALID_INPUT.getStatus())
                    .body(ErrorResponse.of(ErrorCode.INVALID_INPUT, e.getMessage(), request.getRequestURI()));
        }
        return renderErrorPage(ErrorCode.INVALID_INPUT, e.getMessage(), request);
    }

    @ExceptionHandler(Exception.class)
    public Object handleUnknown(Exception e, HttpServletRequest request, Model model) {
        log.error("Unhandled exception at {}", request.getRequestURI(), e);
        if (isApiRequest(request)) {
            return ResponseEntity.status(ErrorCode.INTERNAL_SERVER_ERROR.getStatus())
                    .body(ErrorResponse.of(ErrorCode.INTERNAL_SERVER_ERROR, request.getRequestURI()));
        }
        return renderErrorPage(ErrorCode.INTERNAL_SERVER_ERROR, e.getMessage(), request);
    }

    private boolean isApiRequest(HttpServletRequest request) {
        String uri = request.getRequestURI();
        if (uri != null && uri.startsWith("/api/")) return true;

        String accept = request.getHeader("Accept");
        return accept != null && accept.contains(MediaType.APPLICATION_JSON_VALUE);
    }

    private ModelAndView renderErrorPage(ErrorCode ec, String detail, HttpServletRequest request) {
        ModelAndView mv = new ModelAndView("error/error");
        mv.setStatus(ec.getStatus());
        mv.addObject("status", ec.getStatus().value());
        mv.addObject("code", ec.getCode());
        mv.addObject("message", ec.getMessage());
        mv.addObject("detail", detail);
        mv.addObject("path", request.getRequestURI());
        return mv;
    }
}