package com.mavenscope.engine;

import com.mavenscope.engine.cli.AnalyzeCommand;
import picocli.CommandLine;

public final class Main {

    private Main() {}

    public static void main(String[] args) {
        int exit = new CommandLine(new MavenScopeCli())
                .addSubcommand("analyze", new AnalyzeCommand())
                .setCaseInsensitiveEnumValuesAllowed(true)
                .execute(args);
        System.exit(exit);
    }
}
