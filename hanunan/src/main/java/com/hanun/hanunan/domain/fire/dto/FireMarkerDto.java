package com.hanun.hanunan.domain.fire.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class FireMarkerDto {
    private Long id;
    private String sn;
    private String messageContent;
    private String rcptnRgnNm;
    private String parsedAddress;
    private Double latitude;
    private Double longitude;
    private String createdAt;
}
