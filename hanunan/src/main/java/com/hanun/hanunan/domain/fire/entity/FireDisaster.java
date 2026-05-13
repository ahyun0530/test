package com.hanun.hanunan.domain.fire.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "fire_disaster")
@Builder
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class FireDisaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String sn; // 재난문자 일련번호

    @Column(columnDefinition = "TEXT")
    private String messageContent; // 재난문자 본문

    private String rcptnRgnNm; // 수신지역명

    private String parsedAddress; // Groq + RCPTN_RGN_NM 결합 주소

    private Double latitude;
    private Double longitude;

    private LocalDateTime createdAt;
}
