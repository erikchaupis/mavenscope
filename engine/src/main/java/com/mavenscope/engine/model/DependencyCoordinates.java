package com.mavenscope.engine.model;

public record DependencyCoordinates(
        String groupId, String artifactId, String version, String classifier, String type) {

    public static String key(String groupId, String artifactId) {
        return groupId + ":" + artifactId;
    }

    public String key() {
        return key(groupId, artifactId);
    }

    public String gav() {
        return groupId + ":" + artifactId + ":" + version;
    }
}
