package com.hanun.hanunan.domain.report.dto;

import com.hanun.hanunan.domain.report.entity.CitizenReport;

import java.time.LocalDateTime;
import java.util.List;

public record CitizenReportResponse(
        Long id,
        Long userId,
        String nickname,
        String type,
        String description,
        Double latitude,
        Double longitude,
        Double userLatitude,
        Double userLongitude,
        Double userAccuracyMeters,
        Double distanceMeters,
        Boolean gpsVerified,
        String status,
        List<String> imageUrls,
        LocalDateTime createdAt
) {
    public static CitizenReportResponse from(CitizenReport report) {
        return new CitizenReportResponse(
                report.getId(),
                report.getMember().getId(),
                report.getMember().getName(),
                report.getType(),
                report.getDescription(),
                report.getReportLocation().getY(),
                report.getReportLocation().getX(),
                report.getUserLocation().getY(),
                report.getUserLocation().getX(),
                report.getUserAccuracyMeters(),
                report.getDistanceMeters(),
                report.getGpsVerified(),
                report.getStatus().name(),
                report.getImages().stream().map(image -> image.getImageUrl()).toList(),
                report.getCreatedAt()
        );
    }
}
