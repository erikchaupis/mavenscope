package com.mavenscope.engine.cli;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.mavenscope.engine.analysis.ProjectAnalyzer;
import com.mavenscope.engine.model.AnalysisResult;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.Callable;
import picocli.CommandLine.Command;
import picocli.CommandLine.Option;
import picocli.CommandLine.Parameters;

@Command(name = "analyze", description = "Analyze a Maven project and emit JSON to stdout")
public class AnalyzeCommand implements Callable<Integer> {

    @Parameters(index = "0", description = "Path to Maven project directory (contains pom.xml)")
    private Path projectPath;

    @Option(names = "--pom", description = "Explicit path to pom.xml (optional)")
    private Path pomPath;

    @Option(names = "--offline", description = "Work offline using local repository only")
    private boolean offline;

    @Option(names = "--quiet", description = "Suppress non-JSON stderr output")
    private boolean quiet;

    @Override
    public Integer call() throws Exception {
        Path resolvedProject = projectPath.toAbsolutePath().normalize();
        if (!Files.isDirectory(resolvedProject)) {
            System.err.println("Project path does not exist: " + resolvedProject);
            return 1;
        }

        Path pom = pomPath != null
                ? pomPath.toAbsolutePath().normalize()
                : resolvedProject.resolve("pom.xml");
        if (!Files.isRegularFile(pom)) {
            System.err.println("No pom.xml found at: " + pom);
            return 1;
        }

        ProjectAnalyzer analyzer = new ProjectAnalyzer(!quiet);
        AnalysisResult result = analyzer.analyze(resolvedProject, pom, offline);

        ObjectMapper mapper = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        System.out.println(mapper.writerWithDefaultPrettyPrinter().writeValueAsString(result));
        return 0;
    }
}
