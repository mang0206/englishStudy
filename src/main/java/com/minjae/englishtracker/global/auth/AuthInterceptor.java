package com.minjae.englishtracker.global.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AuthInterceptor implements HandlerInterceptor {

    public static final String AUTH_FLAG = "AUTHENTICATED";

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        String uri = request.getRequestURI();

        // 1) 공개 경로는 무조건 통과 (데모, 로그인, 에러 페이지)
        if (isPublic(uri)) {
            return true;
        }

        // 2) 세션 인증 플래그 확인
        HttpSession session = request.getSession(false);
        boolean authed = session != null && Boolean.TRUE.equals(session.getAttribute(AUTH_FLAG));
        if (authed) {
            return true;
        }

        // 3) 미인증 처리: API는 401, 페이지는 /login 리다이렉트
        if (uri.startsWith("/api/")) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED); // 401
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"message\":\"인증이 필요합니다.\"}");
        } else {
            response.sendRedirect("/login");
        }
        return false;
    }

    private boolean isPublic(String uri) {
        return uri.equals("/login")
                || uri.startsWith("/demo")      // 데모 페이지 + /demo/api/transcript 공개
                || uri.startsWith("/css/")
                || uri.startsWith("/js/")
                || uri.startsWith("/error");
    }
}