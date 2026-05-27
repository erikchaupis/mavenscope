package com.mavenscope.engine.model;

import java.util.List;

public record ConflictInfo(
        String id,
        String kind,
        DependencyCoordinates coordinates,
        DependencyCoordinates winner,
        List<DependencyCoordinates> losers,
        MediationInfo mediation,
        List<List<String>> paths) {}
