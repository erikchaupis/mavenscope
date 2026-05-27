package com.mavenscope.engine.model;

import java.util.List;

public record MediationInfo(
        String strategy,
        String winnerVersion,
        List<String> loserVersions,
        String explanation) {}
