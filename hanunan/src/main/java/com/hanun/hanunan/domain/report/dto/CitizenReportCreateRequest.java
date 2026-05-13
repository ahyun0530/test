package com.hanun.hanunan.domain.report.dto;

import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class CitizenReportCreateRequest {
    private String type;
    private String description;
    private Double pinLatitude;
    private Double pinLongitude;
    private Double userLatitude;
    private Double userLongitude;
    private Double userAccuracyMeters;
    private List<MultipartFile> images = new ArrayList<>();
}
