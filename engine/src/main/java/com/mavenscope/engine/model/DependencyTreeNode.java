package com.mavenscope.engine.model;

import java.util.ArrayList;
import java.util.List;

public class DependencyTreeNode {
    private String id;
    private DependencyCoordinates coordinates;
    private String scope;
    private boolean optional;
    private String role;
    private int depth;
    private List<ExclusionInfo> exclusions = new ArrayList<>();
    private List<DependencyTreeNode> children = new ArrayList<>();
    private List<String> dependencyPath = new ArrayList<>();
    private String requestedVersion;
    private String resolvedVersion;
    private String effectiveVersion;
    private String nodeState;
    private String stateLabel;
    private String managedFrom;
    private Boolean conflictWinner;
    private Boolean conflictLoser;
    private Boolean omittedForConflict;
    private Boolean activeInClasspath;
    private MediationInfo mediation;
    private List<List<String>> paths;
    private String description;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public DependencyCoordinates getCoordinates() {
        return coordinates;
    }

    public void setCoordinates(DependencyCoordinates coordinates) {
        this.coordinates = coordinates;
    }

    public String getScope() {
        return scope;
    }

    public void setScope(String scope) {
        this.scope = scope;
    }

    public boolean isOptional() {
        return optional;
    }

    public void setOptional(boolean optional) {
        this.optional = optional;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public int getDepth() {
        return depth;
    }

    public void setDepth(int depth) {
        this.depth = depth;
    }

    public List<ExclusionInfo> getExclusions() {
        return exclusions;
    }

    public void setExclusions(List<ExclusionInfo> exclusions) {
        this.exclusions = exclusions;
    }

    public List<DependencyTreeNode> getChildren() {
        return children;
    }

    public void setChildren(List<DependencyTreeNode> children) {
        this.children = children;
    }

    public List<String> getDependencyPath() {
        return dependencyPath;
    }

    public void setDependencyPath(List<String> dependencyPath) {
        this.dependencyPath = dependencyPath;
    }

    public String getRequestedVersion() {
        return requestedVersion;
    }

    public void setRequestedVersion(String requestedVersion) {
        this.requestedVersion = requestedVersion;
    }

    public String getResolvedVersion() {
        return resolvedVersion;
    }

    public void setResolvedVersion(String resolvedVersion) {
        this.resolvedVersion = resolvedVersion;
    }

    public String getEffectiveVersion() {
        return effectiveVersion;
    }

    public void setEffectiveVersion(String effectiveVersion) {
        this.effectiveVersion = effectiveVersion;
    }

    public String getNodeState() {
        return nodeState;
    }

    public void setNodeState(String nodeState) {
        this.nodeState = nodeState;
    }

    public String getStateLabel() {
        return stateLabel;
    }

    public void setStateLabel(String stateLabel) {
        this.stateLabel = stateLabel;
    }

    public String getManagedFrom() {
        return managedFrom;
    }

    public void setManagedFrom(String managedFrom) {
        this.managedFrom = managedFrom;
    }

    public Boolean getConflictWinner() {
        return conflictWinner;
    }

    public void setConflictWinner(Boolean conflictWinner) {
        this.conflictWinner = conflictWinner;
    }

    public Boolean getConflictLoser() {
        return conflictLoser;
    }

    public void setConflictLoser(Boolean conflictLoser) {
        this.conflictLoser = conflictLoser;
    }

    public Boolean getOmittedForConflict() {
        return omittedForConflict;
    }

    public void setOmittedForConflict(Boolean omittedForConflict) {
        this.omittedForConflict = omittedForConflict;
    }

    public Boolean getActiveInClasspath() {
        return activeInClasspath;
    }

    public void setActiveInClasspath(Boolean activeInClasspath) {
        this.activeInClasspath = activeInClasspath;
    }

    public MediationInfo getMediation() {
        return mediation;
    }

    public void setMediation(MediationInfo mediation) {
        this.mediation = mediation;
    }

    public List<List<String>> getPaths() {
        return paths;
    }

    public void setPaths(List<List<String>> paths) {
        this.paths = paths;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
