package com.mavenscope.engine.analysis;

import com.mavenscope.engine.model.DependencyCoordinates;
import com.mavenscope.engine.model.DependencyTreeNode;
import com.mavenscope.engine.model.ExclusionInfo;
import com.mavenscope.engine.model.MediationInfo;
import com.mavenscope.engine.model.ResolutionEntry;
import com.mavenscope.engine.model.ResolutionOccurrence;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.apache.maven.artifact.Artifact;
import org.apache.maven.model.Dependency;
import org.apache.maven.model.Exclusion;
import org.apache.maven.project.MavenProject;
import org.apache.maven.shared.dependency.graph.DependencyNode;

/** Maps Maven dependency graph nodes into path-stable MavenScope models. */
public final class DependencyTreeMapper {

    private DependencyTreeMapper() {}

    public static DependencyTreeNode fromMavenNode(DependencyNode node, int depth, String role, List<String> parentPath) {
        Artifact artifact = node.getArtifact();
        DependencyCoordinates coords = new DependencyCoordinates(
                artifact.getGroupId(),
                artifact.getArtifactId(),
                nullToEmpty(artifact.getVersion()),
                nullToEmpty(artifact.getClassifier()),
                nullToEmpty(artifact.getType()));

        List<String> dependencyPath = new ArrayList<>(parentPath);
        String segment = coords.gav() + "@" + depth;
        dependencyPath.add(segment);
        String id = buildStableId(dependencyPath);

        String resolvedVersion = nullToEmpty(artifact.getVersion());
        String premanagedVersion = node.getPremanagedVersion();
        String premanagedScope = node.getPremanagedScope();
        String requestedVersion = premanagedVersion != null ? premanagedVersion : resolvedVersion;

        DependencyTreeNode treeNode = new DependencyTreeNode();
        treeNode.setId(id);
        treeNode.setCoordinates(coords);
        treeNode.setScope(nullToEmpty(artifact.getScope()));
        treeNode.setOptional(Boolean.TRUE.equals(node.getOptional()));
        treeNode.setRole(role);
        treeNode.setDepth(depth);
        treeNode.setExclusions(mapExclusions(node));
        treeNode.setDependencyPath(List.copyOf(dependencyPath));
        treeNode.setResolvedVersion(resolvedVersion);
        treeNode.setRequestedVersion(requestedVersion);
        treeNode.setEffectiveVersion(resolvedVersion);
        treeNode.setActiveInClasspath(true);
        treeNode.setNodeState("active");
        treeNode.setPaths(List.of(List.copyOf(dependencyPath)));

        if (premanagedVersion != null && !premanagedVersion.equals(resolvedVersion)) {
            treeNode.setManagedFrom(premanagedVersion);
            treeNode.setStateLabel("managed from " + premanagedVersion);
            treeNode.setNodeState("managed");
        } else if (premanagedScope != null && !premanagedScope.equals(treeNode.getScope())) {
            treeNode.setStateLabel("scope managed from " + premanagedScope);
            treeNode.setNodeState("managed");
        } else {
            treeNode.setStateLabel("selected version");
        }

        List<DependencyTreeNode> children = new ArrayList<>();
        if (node.getChildren() != null) {
            for (DependencyNode child : node.getChildren()) {
                children.add(fromMavenNode(child, depth + 1, depth == 0 ? "declared" : "transitive", dependencyPath));
            }
        }
        treeNode.setChildren(children);
        return treeNode;
    }

    public static DependencyTreeNode buildDeclaredTree(MavenProject project) {
        DependencyCoordinates rootCoords = new DependencyCoordinates(
                project.getGroupId(),
                project.getArtifactId(),
                project.getVersion(),
                project.getArtifact().getClassifier(),
                project.getPackaging());

        List<String> rootPath = List.of("root");

        DependencyTreeNode root = new DependencyTreeNode();
        root.setId("root");
        root.setCoordinates(rootCoords);
        root.setScope("compile");
        root.setOptional(false);
        root.setRole("root");
        root.setDepth(0);
        root.setResolvedVersion(project.getVersion());
        root.setEffectiveVersion(project.getVersion());
        root.setRequestedVersion(project.getVersion());
        root.setDependencyPath(rootPath);
        root.setExclusions(List.of());
        root.setActiveInClasspath(true);
        root.setNodeState("active");
        root.setStateLabel("project root");
        root.setPaths(List.of(rootPath));

        List<DependencyTreeNode> children = new ArrayList<>();
        for (Dependency dep : project.getDependencies()) {
            children.add(fromDeclaredDependency(dep, 1, rootPath));
        }
        root.setChildren(children);
        return root;
    }

    public static Map<String, ResolutionEntry> buildResolutionIndex(DependencyTreeNode tree) {
        Map<String, List<ResolutionOccurrence>> occurrencesByGa = new LinkedHashMap<>();
        collectOccurrences(tree, occurrencesByGa);

        Map<String, ResolutionEntry> index = new LinkedHashMap<>();
        for (Map.Entry<String, List<ResolutionOccurrence>> entry : occurrencesByGa.entrySet()) {
            String gaKey = entry.getKey();
            List<ResolutionOccurrence> occurrences = entry.getValue();

            ResolutionOccurrence winner = occurrences.stream()
                    .filter(ResolutionOccurrence::activeInClasspath)
                    .min(Comparator.comparingInt(o -> o.dependencyPath().size()))
                    .orElse(occurrences.get(0));

            index.put(
                    gaKey,
                    new ResolutionEntry(
                            gaKey,
                            winner.effectiveVersion(),
                            winner.nodeId(),
                            winner.dependencyPath(),
                            List.copyOf(occurrences)));
        }
        return index;
    }

    public static void applyConflictAnnotations(
            DependencyTreeNode tree,
            Map<String, ResolutionEntry> resolutionIndex,
            Map<String, MediationInfo> mediationByKey) {
        annotateNode(tree, resolutionIndex, mediationByKey);
    }

    private static void annotateNode(
            DependencyTreeNode node,
            Map<String, ResolutionEntry> resolutionIndex,
            Map<String, MediationInfo> mediationByKey) {
        String gaKey = node.getCoordinates().key();
        ResolutionEntry entry = resolutionIndex.get(gaKey);
        MediationInfo mediation = mediationByKey.get(gaKey);

        if (entry != null) {
            boolean isWinner = node.getId().equals(entry.winningNodeId());
            node.setConflictWinner(isWinner);
            if (isWinner) {
                node.setNodeState("active");
                node.setStateLabel("effective version");
                node.setActiveInClasspath(true);
            } else if (!node.getResolvedVersion().equals(entry.effectiveVersion())) {
                node.setConflictLoser(true);
                node.setNodeState("conflict-loser");
                node.setStateLabel("omitted for conflict with " + entry.effectiveVersion());
                node.setOmittedForConflict(true);
                node.setActiveInClasspath(false);
            }
        }

        if (mediation != null) {
            node.setMediation(mediation);
            if (node.getRequestedVersion() != null
                    && !node.getRequestedVersion().equals(node.getResolvedVersion())) {
                node.setStateLabel("managed from " + node.getRequestedVersion());
            }
        }

        for (DependencyTreeNode child : node.getChildren()) {
            annotateNode(child, resolutionIndex, mediationByKey);
        }
    }

    private static void collectOccurrences(
            DependencyTreeNode node, Map<String, List<ResolutionOccurrence>> occurrencesByGa) {
        if (!"root".equals(node.getId())) {
            String gaKey = node.getCoordinates().key();
            occurrencesByGa
                    .computeIfAbsent(gaKey, k -> new ArrayList<>())
                    .add(new ResolutionOccurrence(
                            node.getId(),
                            node.getResolvedVersion(),
                            node.getEffectiveVersion(),
                            node.getDependencyPath(),
                            node.getNodeState(),
                            node.getStateLabel(),
                            Boolean.TRUE.equals(node.getActiveInClasspath())));
        }

        for (DependencyTreeNode child : node.getChildren()) {
            collectOccurrences(child, occurrencesByGa);
        }
    }

    private static DependencyTreeNode fromDeclaredDependency(
            Dependency dep, int depth, List<String> parentPath) {
        DependencyCoordinates coords = new DependencyCoordinates(
                dep.getGroupId(),
                dep.getArtifactId(),
                dep.getVersion(),
                dep.getClassifier(),
                dep.getType() != null ? dep.getType() : "jar");

        List<String> dependencyPath = new ArrayList<>(parentPath);
        String segment = coords.gav() + "@" + depth;
        dependencyPath.add(segment);

        DependencyTreeNode node = new DependencyTreeNode();
        node.setId(buildStableId(dependencyPath));
        node.setCoordinates(coords);
        node.setScope(dep.getScope() != null ? dep.getScope() : "compile");
        node.setOptional(dep.isOptional());
        node.setRole("declared");
        node.setDepth(depth);
        node.setResolvedVersion(dep.getVersion());
        node.setRequestedVersion(dep.getVersion());
        node.setEffectiveVersion(dep.getVersion());
        node.setDependencyPath(List.copyOf(dependencyPath));
        node.setExclusions(dep.getExclusions().stream()
                .map(e -> new ExclusionInfo(e.getGroupId(), e.getArtifactId()))
                .toList());
        node.setChildren(List.of());
        node.setActiveInClasspath(true);
        node.setNodeState("declared");
        node.setStateLabel("declared in pom");
        node.setPaths(List.of(List.copyOf(dependencyPath)));
        return node;
    }

    static String buildStableId(List<String> dependencyPath) {
        if (dependencyPath.isEmpty()) {
            return "root";
        }
        return UUID.nameUUIDFromBytes(String.join("/", dependencyPath).getBytes(StandardCharsets.UTF_8))
                .toString();
    }

    private static List<ExclusionInfo> mapExclusions(DependencyNode node) {
        if (node.getExclusions() == null) {
            return List.of();
        }
        return node.getExclusions().stream()
                .map(DependencyTreeMapper::toExclusion)
                .toList();
    }

    private static ExclusionInfo toExclusion(Exclusion exclusion) {
        return new ExclusionInfo(exclusion.getGroupId(), exclusion.getArtifactId());
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}
