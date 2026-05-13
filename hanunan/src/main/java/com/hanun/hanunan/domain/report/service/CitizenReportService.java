package com.hanun.hanunan.domain.report.service;

import com.hanun.hanunan.domain.member.entity.Member;
import com.hanun.hanunan.domain.member.repository.MemberRepository;
import com.hanun.hanunan.domain.report.dto.CitizenReportCreateRequest;
import com.hanun.hanunan.domain.report.entity.CitizenReport;
import com.hanun.hanunan.domain.report.entity.CitizenReportImage;
import com.hanun.hanunan.domain.report.repository.CitizenReportRepository;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CitizenReportService {
    private static final int SRID_WGS84 = 4326;
    private static final double MAX_DISTANCE_METERS = 500.0;
    private static final double MAX_GPS_ACCURACY_METERS = 100.0;
    private static final int MAX_IMAGE_COUNT = 3;
    private static final long MAX_IMAGE_BYTES = 10 * 1024 * 1024;

    private final CitizenReportRepository citizenReportRepository;
    private final MemberRepository memberRepository;
    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), SRID_WGS84);

    @Value("${app.upload.report-image-dir:uploads/reports}")
    private String reportImageDir;

    @Transactional
    public CitizenReport create(String memberEmail, CitizenReportCreateRequest request) {
        Member member = memberRepository.findByEmail(memberEmail)
                .orElseThrow(() -> new AccessDeniedException("인증된 사용자만 제보할 수 있습니다."));

        validateRequest(request);

        double distanceMeters = calculateDistanceMeters(
                request.getUserLatitude(),
                request.getUserLongitude(),
                request.getPinLatitude(),
                request.getPinLongitude()
        );

        if (request.getUserAccuracyMeters() != null && request.getUserAccuracyMeters() > MAX_GPS_ACCURACY_METERS) {
            throw new IllegalArgumentException("GPS 오차가 너무 큽니다. 실외에서 다시 시도해 주세요.");
        }

        if (distanceMeters > MAX_DISTANCE_METERS) {
            throw new IllegalArgumentException("현재 위치와 제보 위치가 500m 이상 떨어져 있어 등록할 수 없습니다.");
        }

        CitizenReport report = CitizenReport.builder()
                .member(member)
                .type(request.getType().trim())
                .description(request.getDescription().trim())
                .reportLocation(point(request.getPinLongitude(), request.getPinLatitude()))
                .userLocation(point(request.getUserLongitude(), request.getUserLatitude()))
                .userAccuracyMeters(request.getUserAccuracyMeters())
                .distanceMeters(distanceMeters)
                .gpsVerified(true)
                .build();

        List<MultipartFile> images = request.getImages() == null ? List.of() : request.getImages();
        for (MultipartFile image : images) {
            if (image == null || image.isEmpty()) continue;
            StoredImage storedImage = storeImage(image);
            report.addImage(CitizenReportImage.builder()
                    .imageUrl(storedImage.url())
                    .storedFileName(storedImage.storedFileName())
                    .originalFileName(image.getOriginalFilename())
                    .build());
        }

        return citizenReportRepository.save(report);
    }

    @Transactional(readOnly = true)
    public List<CitizenReport> findAll() {
        return citizenReportRepository.findAllByOrderByCreatedAtDesc();
    }

    private void validateRequest(CitizenReportCreateRequest request) {
        if (!StringUtils.hasText(request.getType())) {
            throw new IllegalArgumentException("제보 유형을 입력해 주세요.");
        }
        if (!StringUtils.hasText(request.getDescription())) {
            throw new IllegalArgumentException("제보 내용을 입력해 주세요.");
        }
        validateCoordinate(request.getPinLatitude(), request.getPinLongitude(), "지도 핀 위치");
        validateCoordinate(request.getUserLatitude(), request.getUserLongitude(), "현재 GPS 위치");
        if (request.getImages() != null && request.getImages().size() > MAX_IMAGE_COUNT) {
            throw new IllegalArgumentException("사진은 최대 3장까지 첨부할 수 있습니다.");
        }
    }

    private void validateCoordinate(Double latitude, Double longitude, String label) {
        if (latitude == null || longitude == null) {
            throw new IllegalArgumentException(label + "가 필요합니다.");
        }
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            throw new IllegalArgumentException(label + " 좌표가 올바르지 않습니다.");
        }
    }

    private Point point(double longitude, double latitude) {
        Point point = geometryFactory.createPoint(new Coordinate(longitude, latitude));
        point.setSRID(SRID_WGS84);
        return point;
    }

    private double calculateDistanceMeters(double lat1, double lon1, double lat2, double lon2) {
        double earthRadiusMeters = 6371000.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private StoredImage storeImage(MultipartFile image) {
        String contentType = image.getContentType();
        if (contentType == null || !contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
            throw new IllegalArgumentException("이미지 파일만 첨부할 수 있습니다.");
        }
        if (image.getSize() > MAX_IMAGE_BYTES) {
            throw new IllegalArgumentException("이미지는 10MB 이하만 첨부할 수 있습니다.");
        }

        String extension = StringUtils.getFilenameExtension(image.getOriginalFilename());
        String storedFileName = UUID.randomUUID() + (StringUtils.hasText(extension) ? "." + extension : "");
        Path uploadDir = Path.of(reportImageDir).toAbsolutePath().normalize();
        Path target = uploadDir.resolve(storedFileName).normalize();

        if (!target.startsWith(uploadDir)) {
            throw new IllegalArgumentException("파일 경로가 올바르지 않습니다.");
        }

        try {
            Files.createDirectories(uploadDir);
            Files.copy(image.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new IllegalStateException("이미지 저장에 실패했습니다.", e);
        }

        return new StoredImage(storedFileName, "/uploads/reports/" + storedFileName);
    }

    private record StoredImage(String storedFileName, String url) {
    }
}
