package com.hanun.hanunan.domain.fire.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
public class GroqRequest {
    private String model = "llama-3.3-70b-versatile";
    private List<Message> messages;
    private double temperature = 0.1;

    @Data
    @AllArgsConstructor
    public static class Message {
        private String role;
        private String content;
    }
}
