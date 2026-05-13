package com.hanun.hanunan.domain.fire.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class DisasterApiItem {

    @JsonProperty("SN")
    private String sn; // 일련번호

    @JsonProperty("MSG_CN")
    private String msgCn; // 재난문자 본문

    @JsonProperty("RCPTN_RGN_NM")
    private String rcptnRgnNm; // 수신지역명

    @JsonProperty("DST_SE_NM")
    private String dstSeNm; // 재해구분명 (화재 필터링용)

    @JsonProperty("CRT_DT")
    private String crtDt; // 생성일시
}
