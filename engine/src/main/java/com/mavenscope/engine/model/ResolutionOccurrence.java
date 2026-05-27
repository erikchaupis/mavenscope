package com.mavenscope.engine.model;

import java.util.List;

public record ResolutionOccurrence(
        String nodeId,
        String version,
        String effectiveVersion,
        List<String> dependencyPath,
        String nodeState,
        String stateLabel,
        boolean activeInClasspath) {}
