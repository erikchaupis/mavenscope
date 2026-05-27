package com.mavenscope.engine.analysis;

import com.mavenscope.engine.maven.MavenBootstrap;
import com.mavenscope.engine.model.AnalysisMetadata;
import com.mavenscope.engine.model.AnalysisResult;
import com.mavenscope.engine.model.DependencyTreeNode;
import com.mavenscope.engine.model.MediationInfo;
import com.mavenscope.engine.model.ProjectInfo;
import com.mavenscope.engine.model.ResolutionEntry;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.apache.maven.project.MavenProject;
import org.apache.maven.shared.dependency.graph.DependencyNode;
import org.eclipse.aether.RepositorySystemSession;

public final class ProjectAnalyzer {

    private static final String MAVEN_VERSION = resolveMavenVersion();

    private static String resolveMavenVersion() {
        Package pkg = org.apache.maven.Maven.class.getPackage();
        String version = pkg != null ? pkg.getImplementationVersion() : null;
        return version != null ? version : "3.9.9";
    }
    private static final String RESOLVER_VERSION = "managed-by-maven-core";

    private final boolean verbose;

    public ProjectAnalyzer(boolean verbose) {
        this.verbose = verbose;
    }

    public AnalysisResult analyze(Path projectPath, Path pomFile, boolean offline) throws Exception {
        long start = System.currentTimeMillis();
        List<String> warnings = new ArrayList<>();

        try (MavenBootstrap bootstrap = new MavenBootstrap()) {
            if (verbose) {
                System.err.println("[MavenScope] Building project model from " + pomFile);
            }

            RepositorySystemSession session = bootstrap.createSession(projectPath, offline);
            MavenProject project = bootstrap.buildProject(projectPath, pomFile, offline);

            if (verbose) {
                System.err.println("[MavenScope] Resolving dependency tree...");
            }

            DependencyNode mavenRoot = bootstrap.buildResolvedGraph(project, session);
            DependencyTreeNode declaredTree = DependencyTreeMapper.buildDeclaredTree(project);
            DependencyTreeNode resolvedTree =
                    DependencyTreeMapper.fromMavenNode(mavenRoot, 0, "root", List.of("root"));

            Map<String, ResolutionEntry> resolutionIndex = DependencyTreeMapper.buildResolutionIndex(resolvedTree);

            ConflictDetector.ConflictDetectionResult conflictResult =
                    ConflictDetector.detect(declaredTree, resolvedTree);

            DependencyTreeMapper.applyConflictAnnotations(
                    resolvedTree, resolutionIndex, conflictResult.mediationByKey());

            long duration = System.currentTimeMillis() - start;

            ProjectInfo projectInfo = new ProjectInfo(
                    project.getGroupId(),
                    project.getArtifactId(),
                    project.getVersion(),
                    project.getPackaging(),
                    project.getName(),
                    project.getDescription(),
                    project.getModules());

            AnalysisMetadata metadata = new AnalysisMetadata(
                    Instant.now().toString(),
                    projectPath.toString(),
                    MAVEN_VERSION,
                    RESOLVER_VERSION,
                    duration,
                    project.getModules().size() + 1,
                    warnings);

            return new AnalysisResult(
                    projectInfo,
                    declaredTree,
                    resolvedTree,
                    conflictResult.conflicts(),
                    resolutionIndex,
                    metadata);
        }
    }
}
