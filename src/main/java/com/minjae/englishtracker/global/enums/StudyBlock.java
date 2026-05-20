package com.minjae.englishtracker.global.enums;

public enum StudyBlock {
    NOESAEKIM("뇌새김", 30, "📘"),
    SHADOWING("쉐도잉", 90, "🎧"),
    EXPANSION("문장 확장", 90, "🧩"),
    AI_CONVERSATION("AI 회화", 120, "🗣"),
    READING("읽기 / 듣기", 30, "📖");

    private final String displayName;
    private final int minutes;
    private final String icon;

    StudyBlock(String displayName, int minutes, String icon) {
        this.displayName = displayName;
        this.minutes = minutes;
        this.icon = icon;
    }

    public String getDisplayName() { return displayName; }
    public int getMinutes() { return minutes; }
    public String getIcon() { return icon; }

    public String getTimeLabel() {
        if (minutes < 60) return minutes + "분";
        int h = minutes / 60, m = minutes % 60;
        return m > 0 ? h + "시간 " + m + "분" : h + "시간";
    }
}
