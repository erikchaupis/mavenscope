package com.mavenscope.engine.model;

import java.util.List;

public record ResolutionEntry(
        String gaKey,
        String effectiveVersion,
        String winningNodeId,
        List<String> winningPath,
        List<ResolutionOccurrence> occurrences) {}
