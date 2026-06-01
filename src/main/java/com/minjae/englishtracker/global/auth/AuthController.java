package com.minjae.englishtracker.global.auth;

import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
public class AuthController {

    @Value("${app.auth.password}")
    private String appPassword;

    @GetMapping("/login")
    public String loginPage() {
        return "auth/login";
    }

    @PostMapping("/login")
    public String login(@RequestParam String password, HttpSession session, Model model) {
        if (appPassword.equals(password)) {
            session.setAttribute(AuthInterceptor.AUTH_FLAG, Boolean.TRUE);
            return "redirect:/";   // 인증 성공 → 기존 메인(관리 탭)으로
        }
        model.addAttribute("error", "비밀번호가 올바르지 않습니다.");
        return "auth/login";
    }

    @PostMapping("/logout")
    public String logout(HttpSession session) {
        session.invalidate();
        return "redirect:/login";
    }
}