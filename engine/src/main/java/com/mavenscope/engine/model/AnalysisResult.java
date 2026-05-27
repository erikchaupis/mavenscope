package com.mavenscope.engine.model;

import java.util.List;
import java.util.Map;

public record AnalysisResult(
        int schemaVersion,
        ProjectInfo project,
        DependencyTreeNode declaredTree,
        DependencyTreeNode resolvedTree,
        List<ConflictInfo> conflicts,
        Map<String, ResolutionEntry> resolutionIndex,
        AnalysisMetadata metadata) {

    public AnalysisResult(
            ProjectInfo project,
            DependencyTreeNode declaredTree,
            DependencyTreeNode resolvedTree,
            List<ConflictInfo> conflicts,
            Map<String, ResolutionEntry> resolutionIndex,
            AnalysisMetadata metadata) {
        this(2, project, declaredTree, resolvedTree, conflicts, resolutionIndex, metadata);
    }
}
