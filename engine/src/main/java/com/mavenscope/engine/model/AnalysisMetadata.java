package com.mavenscope.engine.model;

import java.util.List;

public record AnalysisMetadata(
        String analyzedAt,
        String projectPath,
        String mavenVersion,
        String resolverVersion,
        long durationMs,
        int moduleCount,
        List<String> warnings) {}
