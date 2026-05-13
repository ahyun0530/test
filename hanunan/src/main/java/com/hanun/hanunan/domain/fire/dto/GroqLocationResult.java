package com.hanun.hanunan.domain.fire.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class GroqLocationResult {

    @JsonProperty("location_found")
    private boolean locationFound;

    private String address;
}
