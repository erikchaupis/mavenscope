package com.mavenscope.engine;

import picocli.CommandLine.Command;

@Command(
        name = "mavenscope-engine",
        mixinStandardHelpOptions = true,
        version = "0.1.0",
        description = "MavenScope dependency analysis engine")
public class MavenScopeCli {}
