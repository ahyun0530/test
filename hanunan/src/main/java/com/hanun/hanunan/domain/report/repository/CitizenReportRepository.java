package com.hanun.hanunan.domain.report.repository;

import com.hanun.hanunan.domain.report.entity.CitizenReport;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CitizenReportRepository extends JpaRepository<CitizenReport, Long> {
    @EntityGraph(attributePaths = {"member", "images"})
    List<CitizenReport> findAllByOrderByCreatedAtDesc();
}
