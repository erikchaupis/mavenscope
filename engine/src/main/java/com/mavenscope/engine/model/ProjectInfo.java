package com.mavenscope.engine.model;

import java.util.List;

public record ProjectInfo(
        String groupId,
        String artifactId,
        String version,
        String packaging,
        String name,
        String description,
        List<String> modules) {}
