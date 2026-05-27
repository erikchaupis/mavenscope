package com.mavenscope.engine.maven;

import java.io.File;
import java.nio.file.Path;
import java.util.Properties;
import org.apache.maven.artifact.repository.ArtifactRepository;
import org.apache.maven.bridge.MavenRepositorySystem;
import org.apache.maven.execution.DefaultMavenExecutionRequest;
import org.apache.maven.execution.MavenExecutionRequest;
import org.apache.maven.internal.aether.DefaultRepositorySystemSessionFactory;
import org.apache.maven.project.MavenProject;
import org.apache.maven.project.ProjectBuilder;
import org.apache.maven.project.ProjectBuildingRequest;
import org.apache.maven.project.ProjectBuildingResult;
import org.apache.maven.project.DefaultProjectBuildingRequest;
import org.apache.maven.settings.Settings;
import org.apache.maven.settings.building.DefaultSettingsBuildingRequest;
import org.apache.maven.settings.building.SettingsBuilder;
import org.apache.maven.settings.building.SettingsBuildingRequest;
import org.apache.maven.settings.building.SettingsBuildingResult;
import org.apache.maven.settings.building.DefaultSettingsBuilderFactory;
import org.apache.maven.shared.dependency.graph.DependencyGraphBuilder;
import org.apache.maven.shared.dependency.graph.DependencyGraphBuilderException;
import org.apache.maven.shared.dependency.graph.DependencyNode;
import org.codehaus.plexus.PlexusConstants;
import org.codehaus.plexus.DefaultContainerConfiguration;
import org.codehaus.plexus.DefaultPlexusContainer;
import org.codehaus.plexus.PlexusContainer;
import org.codehaus.plexus.classworlds.ClassWorld;
import org.eclipse.aether.DefaultRepositorySystemSession;
import org.eclipse.aether.RepositorySystemSession;
import org.eclipse.aether.util.graph.manager.DependencyManagerUtils;
import org.eclipse.aether.util.graph.transformer.ConflictResolver;

/**
 * Bootstraps an embedded Maven Plexus container with ProjectBuilder and DependencyGraphBuilder.
 */
public final class MavenBootstrap implements AutoCloseable {

    private final PlexusContainer container;
    private final ProjectBuilder projectBuilder;
    private final DependencyGraphBuilder dependencyGraphBuilder;
    private final DefaultRepositorySystemSessionFactory sessionFactory;
    private final MavenRepositorySystem mavenRepositorySystem;
    private final Settings settings;

    public MavenBootstrap() throws Exception {
        ClassWorld classWorld = new ClassWorld("mavenscope", Thread.currentThread().getContextClassLoader());
        DefaultContainerConfiguration config = new DefaultContainerConfiguration();
        config.setClassWorld(classWorld);
        config.setClassPathScanning(PlexusConstants.SCANNING_INDEX);
        config.setName("mavenscope-engine");

        this.container = new DefaultPlexusContainer(config);
        this.projectBuilder = container.lookup(ProjectBuilder.class);
        this.dependencyGraphBuilder = container.lookup(DependencyGraphBuilder.class);
        this.sessionFactory = container.lookup(DefaultRepositorySystemSessionFactory.class);
        this.mavenRepositorySystem = container.lookup(MavenRepositorySystem.class);
        this.settings = loadSettings();
    }

    public MavenProject buildProject(Path projectPath, Path pomFile, boolean offline) throws Exception {
        RepositorySystemSession session = createSession(projectPath, offline);
        ProjectBuildingRequest request = new DefaultProjectBuildingRequest();
        request.setRepositorySession(session);
        request.setResolveDependencies(true);
        request.setProcessPlugins(true);
        request.setSystemProperties(System.getProperties());
        request.setUserProperties(new Properties());

        ProjectBuildingResult result = projectBuilder.build(pomFile.toFile(), request);
        if (!result.getProblems().isEmpty()) {
            throw new IllegalStateException("Project build errors: " + result.getProblems());
        }
        return result.getProject();
    }

    public DependencyNode buildResolvedGraph(MavenProject project, RepositorySystemSession session)
            throws DependencyGraphBuilderException {
        ProjectBuildingRequest buildingRequest = new DefaultProjectBuildingRequest();
        buildingRequest.setRepositorySession(session);
        buildingRequest.setProject(project);
        buildingRequest.setResolveDependencies(true);
        buildingRequest.setRemoteRepositories(project.getRemoteArtifactRepositories());
        buildingRequest.setSystemProperties(System.getProperties());
        buildingRequest.setUserProperties(new Properties());
        return dependencyGraphBuilder.buildDependencyGraph(buildingRequest, null);
    }

    public RepositorySystemSession createSession(Path projectPath, boolean offline) throws Exception {
        MavenExecutionRequest execRequest = new DefaultMavenExecutionRequest();
        execRequest.setBaseDirectory(projectPath.toFile());
        execRequest.setOffline(offline);
        execRequest.setSystemProperties(System.getProperties());
        execRequest.setUserProperties(new Properties());

        File localRepo = resolveLocalRepository();
        execRequest.setLocalRepositoryPath(localRepo);
        ArtifactRepository localRepository = mavenRepositorySystem.createLocalRepository(execRequest, localRepo);
        execRequest.setLocalRepository(localRepository);
        execRequest.addRemoteRepository(mavenRepositorySystem.createDefaultRemoteRepository(execRequest));

        DefaultRepositorySystemSession session = sessionFactory.newRepositorySession(execRequest);
        session.setConfigProperty(DependencyManagerUtils.CONFIG_PROP_VERBOSE, true);
        session.setConfigProperty(ConflictResolver.CONFIG_PROP_VERBOSE, true);
        return session;
    }

    private File resolveLocalRepository() {
        String localRepo = settings.getLocalRepository();
        if (localRepo != null && !localRepo.isBlank()) {
            return new File(localRepo);
        }
        return new File(System.getProperty("user.home"), ".m2/repository");
    }

    private static Settings loadSettings() throws Exception {
        SettingsBuildingRequest request = new DefaultSettingsBuildingRequest();
        SettingsBuilder builder = new DefaultSettingsBuilderFactory().newInstance();
        SettingsBuildingResult result = builder.build(request);
        return result.getEffectiveSettings();
    }

    @Override
    public void close() {
        container.dispose();
    }
}
