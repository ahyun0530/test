package com.hanun.hanunan.domain.member.controller;


import com.hanun.hanunan.domain.member.dto.*;
import com.hanun.hanunan.domain.member.entity.Member;
import com.hanun.hanunan.domain.member.entity.SocialType;
import com.hanun.hanunan.domain.member.service.GoogleService;
import com.hanun.hanunan.domain.member.service.KakaoService;
import com.hanun.hanunan.domain.member.service.MemberService;
import com.hanun.hanunan.global.security.JwtTokenProvider;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/member")
public class MemberController {
    private final MemberService memberService;
    private final JwtTokenProvider jwtTokenProvider;
    private final GoogleService googleService;
    private final KakaoService kakaoService;

    public MemberController(MemberService memberService, JwtTokenProvider jwtTokenProvider, GoogleService googleService, KakaoService kakaoService) {
        this.memberService = memberService;
        this.jwtTokenProvider = jwtTokenProvider;
        this.googleService = googleService;
        this.kakaoService = kakaoService;
    }

    @PostMapping("/create")
    public ResponseEntity<?> memberCreate(@RequestBody MemberCreateDto memberCreateDto){
        Member member = memberService.create(memberCreateDto);
        return new ResponseEntity<>(member.getId(), HttpStatus.CREATED);
    }

    @PostMapping("/doLogin")
    public ResponseEntity<?> doLogin(@RequestBody MemberLoginDto memberLoginDto){
//        email, password 일치한지 검증
        Member member = memberService.login(memberLoginDto);

//        일치할 경우 jwt accesstoken 생성
        String jwtToken = jwtTokenProvider.createToken(member.getEmail(), member.getRole().toString());

        Map<String, Object> loginInfo = new HashMap<>();
        loginInfo.put("id", member.getId());
        loginInfo.put("token", jwtToken);
        return new ResponseEntity<>(loginInfo, HttpStatus.OK);
    }

    @PostMapping("/google/doLogin")
    public ResponseEntity<?> googleLogin(@RequestBody RedirectDto redirectDto){
        AccessTokenDto accessTokenDto = googleService.getAccessToken(redirectDto.getCode());
        GoogleProfileDto googleProfileDto = googleService.getGoogleProfile(accessTokenDto.getAccess_token());

        Member originalMember = memberService.getMemberBySocialId(googleProfileDto.getSub());
        if(originalMember == null){
            String name = googleProfileDto.getName() != null ? googleProfileDto.getName()
                    : googleProfileDto.getEmail().split("@")[0];
            originalMember = memberService.createOauth(googleProfileDto.getSub(), googleProfileDto.getEmail(), name, SocialType.GOOGLE);
        }

        String jwtToken = jwtTokenProvider.createToken(originalMember.getEmail(), originalMember.getRole().toString());

        Map<String, Object> loginInfo = new HashMap<>();
        loginInfo.put("id", originalMember.getId());
        loginInfo.put("token", jwtToken);
        loginInfo.put("nickname", originalMember.getName());
        loginInfo.put("email", originalMember.getEmail());
        return new ResponseEntity<>(loginInfo, HttpStatus.OK);
    }


    @PostMapping("/kakao/doLogin")
    public ResponseEntity<?> kakaoLogin(@RequestBody RedirectDto redirectDto){
        AccessTokenDto accessTokenDto = kakaoService.getAccessToken(redirectDto.getCode());
        KakaoProfileDto kakaoProfileDto = kakaoService.getKakaoProfile(accessTokenDto.getAccess_token());

        String kakaoSocialId = String.valueOf(kakaoProfileDto.getId());
        Member originalMember = memberService.getMemberBySocialId(kakaoSocialId);
        if(originalMember == null){
            String nickname = (kakaoProfileDto.getKakao_account() != null
                    && kakaoProfileDto.getKakao_account().getProfile() != null)
                    ? kakaoProfileDto.getKakao_account().getProfile().getNickname() : "사용자";
            String email = kakaoProfileDto.getKakao_account() != null
                    ? kakaoProfileDto.getKakao_account().getEmail() : kakaoSocialId + "@kakao.com";
            originalMember = memberService.createOauth(kakaoSocialId, email, nickname, SocialType.KAKAO);
        }

        String jwtToken = jwtTokenProvider.createToken(originalMember.getEmail(), originalMember.getRole().toString());

        Map<String, Object> loginInfo = new HashMap<>();
        loginInfo.put("id", originalMember.getId());
        loginInfo.put("token", jwtToken);
        loginInfo.put("nickname", originalMember.getName());
        loginInfo.put("email", originalMember.getEmail());
        return new ResponseEntity<>(loginInfo, HttpStatus.OK);
    }
}







