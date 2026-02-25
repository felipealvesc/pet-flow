package com.example.petflow;

import java.util.List;

public final class MenuModels {
    private MenuModels() {
    }

    public record MenuResponse(List<MenuSection> sections) {
    }

    public record MenuSection(String key, String label, List<MenuGroup> groups, String reportLabel) {
    }

    public record MenuGroup(String title, List<MenuItem> items) {
    }

    public record MenuItem(String label, boolean locked) {
    }
}
