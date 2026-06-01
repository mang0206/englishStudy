package com.minjae.englishtracker.global.config;

import com.minjae.englishtracker.global.auth.AuthInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    private final AuthInterceptor authInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(authInterceptor)
                .addPathPatterns("/**")
                // 정적/공개 경로는 인터셉터 자체를 안 태움 (이중 방어, isPublic과 중복돼도 무방)
                .excludePathPatterns("/css/**", "/js/**", "/error", "/login");
    }
}