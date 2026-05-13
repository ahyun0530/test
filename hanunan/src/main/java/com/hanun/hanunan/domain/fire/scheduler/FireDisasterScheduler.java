package com.hanun.hanunan.domain.fire.scheduler;

import com.hanun.hanunan.domain.fire.service.FireDisasterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class FireDisasterScheduler {

    private final FireDisasterService fireDisasterService;

    // 5분마다 실행 (서버 시작 후 1분 뒤 첫 실행)
    @Scheduled(initialDelay = 60000, fixedDelay = 300000)
    public void fetchFireDisasters() {
        log.info("스케줄러 실행: 재난문자 API 조회");
        fireDisasterService.fetchAndProcessFireMessages();
    }
}
