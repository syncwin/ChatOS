
import { useState, useEffect } from 'react';

interface SidebarSectionState {
  isCollapsed: boolean;
  isPinned: boolean;
}

interface SidebarSections {
  chatHistory: SidebarSectionState;
  folders: SidebarSectionState;
  tags: SidebarSectionState;
}

const DEFAULT_STATE: SidebarSections = {
  chatHistory: { isCollapsed: false, isPinned: true },
  folders: { isCollapsed: false, isPinned: false },
  tags: { isCollapsed: false, isPinned: false },
};

export const useSidebarSections = () => {
  const [sections, setSections] = useState<SidebarSections>(() => {
    try {
      const saved = localStorage.getItem('sidebar-sections-state');
      return saved ? JSON.parse(saved) : DEFAULT_STATE;
    } catch {
      return DEFAULT_STATE;
    }
  });

  useEffect(() => {
    localStorage.setItem('sidebar-sections-state', JSON.stringify(sections));
  }, [sections]);

  const toggleSection = (sectionKey: keyof SidebarSections) => {
    setSections(prev => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        isCollapsed: !prev[sectionKey].isCollapsed,
      },
    }));
  };

  const togglePin = (sectionKey: keyof SidebarSections) => {
    setSections(prev => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        isPinned: !prev[sectionKey].isPinned,
      },
    }));
  };

  return {
    sections,
    toggleSection,
    togglePin,
  };
};
