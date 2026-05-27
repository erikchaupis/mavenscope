package com.mavenscope.engine.analysis;

import com.mavenscope.engine.model.ConflictInfo;
import com.mavenscope.engine.model.DependencyCoordinates;
import com.mavenscope.engine.model.DependencyTreeNode;
import com.mavenscope.engine.model.MediationInfo;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Detects version conflicts by comparing declared direct dependencies with the resolved tree
 * and by collecting multiple version paths through the dependency graph.
 */
public final class ConflictDetector {

    private ConflictDetector() {}

    public record ConflictDetectionResult(List<ConflictInfo> conflicts, Map<String, MediationInfo> mediationByKey) {}

    public static ConflictDetectionResult detect(
            DependencyTreeNode declaredTree, DependencyTreeNode resolvedTree) {
        Map<String, Set<String>> versionsByGa = new HashMap<>();
        Map<String, List<List<String>>> pathsByGaVersion = new HashMap<>();

        collectPaths(resolvedTree, new ArrayList<>(), versionsByGa, pathsByGaVersion);

        Map<String, String> declaredVersions = new HashMap<>();
        for (DependencyTreeNode child : declaredTree.getChildren()) {
            declaredVersions.put(child.getCoordinates().key(), child.getCoordinates().version());
        }

        Map<String, MediationInfo> mediationByKey = new LinkedHashMap<>();
        List<ConflictInfo> conflicts = new ArrayList<>();

        for (Map.Entry<String, Set<String>> entry : versionsByGa.entrySet()) {
            if (entry.getValue().size() <= 1) {
                continue;
            }
            String ga = entry.getKey();
            String[] parts = ga.split(":", 2);
            String winner = pickWinnerVersion(entry.getValue(), pathsByGaVersion, ga);
            List<String> losers = entry.getValue().stream()
                    .filter(v -> !v.equals(winner))
                    .sorted()
                    .toList();

            String declared = declaredVersions.get(ga);
            String strategy = declared != null && !declared.equals(winner)
                    ? "nearest-wins"
                    : "dependency-management";
            String explanation = buildExplanation(ga, winner, losers, declared, strategy);

            MediationInfo mediation = new MediationInfo(strategy, winner, losers, explanation);
            mediationByKey.put(ga, mediation);

            List<DependencyCoordinates> loserCoords = losers.stream()
                    .map(v -> new DependencyCoordinates(parts[0], parts[1], v, null, "jar"))
                    .toList();

            List<List<String>> paths = new ArrayList<>();
            for (String loser : losers) {
                paths.addAll(pathsByGaVersion.getOrDefault(ga + "@" + loser, List.of()));
            }
            paths.addAll(pathsByGaVersion.getOrDefault(ga + "@" + winner, List.of()));

            conflicts.add(new ConflictInfo(
                    "conflict-" + UUID.nameUUIDFromBytes(ga.getBytes()),
                    "version",
                    new DependencyCoordinates(parts[0], parts[1], winner, null, "jar"),
                    new DependencyCoordinates(parts[0], parts[1], winner, null, "jar"),
                    loserCoords,
                    mediation,
                    paths));
        }

        annotateTree(resolvedTree, declaredVersions, mediationByKey);
        return new ConflictDetectionResult(conflicts, mediationByKey);
    }

    private static void annotateTree(
            DependencyTreeNode node,
            Map<String, String> declaredVersions,
            Map<String, MediationInfo> mediationByKey) {
        String ga = node.getCoordinates().key();
        String declared = declaredVersions.get(ga);
        MediationInfo mediation = mediationByKey.get(ga);

        if (mediation != null) {
            boolean isWinner = node.getCoordinates().version().equals(mediation.winnerVersion());
            node.setConflictWinner(isWinner);
            if (declared != null && !declared.equals(node.getCoordinates().version())) {
                node.setRequestedVersion(declared);
                node.setConflictLoser(!isWinner);
            }
            if (!isWinner) {
                node.setConflictLoser(true);
            }
            node.setMediation(mediation);
        }

        for (DependencyTreeNode child : node.getChildren()) {
            annotateTree(child, declaredVersions, mediationByKey);
        }
    }

    private static void collectPaths(
            DependencyTreeNode node,
            List<String> currentPath,
            Map<String, Set<String>> versionsByGa,
            Map<String, List<List<String>>> pathsByGaVersion) {
        List<String> path = new ArrayList<>(currentPath);
        path.add(node.getCoordinates().gav());

        String ga = node.getCoordinates().key();
        String version = node.getCoordinates().version();
        versionsByGa.computeIfAbsent(ga, k -> new HashSet<>()).add(version);
        pathsByGaVersion
                .computeIfAbsent(ga + "@" + version, k -> new ArrayList<>())
                .add(List.copyOf(path));

        for (DependencyTreeNode child : node.getChildren()) {
            collectPaths(child, path, versionsByGa, pathsByGaVersion);
        }
    }

    private static String pickWinnerVersion(
            Set<String> versions, Map<String, List<List<String>>> pathsByGaVersion, String ga) {
        String best = null;
        int bestDepth = Integer.MAX_VALUE;
        for (String version : versions) {
            List<List<String>> paths = pathsByGaVersion.getOrDefault(ga + "@" + version, List.of());
            int minDepth = paths.stream().mapToInt(List::size).min().orElse(Integer.MAX_VALUE);
            if (minDepth < bestDepth) {
                bestDepth = minDepth;
                best = version;
            }
        }
        return best != null ? best : versions.iterator().next();
    }

    private static String buildExplanation(
            String ga, String winner, List<String> losers, String declared, String strategy) {
        StringBuilder sb = new StringBuilder();
        sb.append("Maven selected version ").append(winner).append(" for ").append(ga);
        if (!losers.isEmpty()) {
            sb.append("; rejected version(s): ").append(String.join(", ", losers));
        }
        if (declared != null && !declared.equals(winner)) {
            sb.append(". Declared version was ").append(declared).append(" but ");
            sb.append(strategy.replace('-', ' ')).append(" mediation applied.");
        }
        return sb.toString();
    }
}
