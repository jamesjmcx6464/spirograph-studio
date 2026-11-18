import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  GraduationCap,
  Lightbulb,
  Settings,
  Sparkles,
  X,
} from 'lucide-react';
import { THEME } from '../constants/palette';
import { TUTORIAL_CATEGORIES } from '../data/learnContent';
import { LessonItem, TutorialCategory } from '../types/spirograph';
import { BottomSheetShell } from './BottomSheetShell';

interface LearnSheetProps {
  onDismiss: () => void;
}

export const LearnSheet: React.FC<LearnSheetProps> = ({ onDismiss }) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    basics: true,
    complex_machines: false,
    golden_ratio: false,
  });
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);
  const [showTutorialDialog, setShowTutorialDialog] = useState(false);

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleLesson = (id: string) => {
    setExpandedLessonId((prev) => (prev === id ? null : id));
  };

  return (
    <>
      <BottomSheetShell onDismiss={onDismiss}>
        <div className="flex min-h-0 flex-1 flex-col px-[18px] pb-7">
          {/* Header */}
          <div className="flex items-center justify-between pt-1 pb-3.5">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                style={{
                  backgroundColor: 'rgba(201, 162, 106, 0.15)',
                  border: '1px solid rgba(201, 162, 106, 0.6)',
                }}
              >
                <GraduationCap className="h-5 w-5" style={{ color: THEME.BrassGold }} />
              </div>
              <div>
                <h2
                  className="text-[16px] font-bold tracking-[1.6px]"
                  style={{ color: THEME.BrassGold }}
                >
                  LEARN
                </h2>
                <p className="text-[12px]" style={{ color: THEME.MutedGray }}>
                  Guides &amp; mechanical geometry lessons
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onDismiss}
              aria-label="Close"
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/5 cursor-pointer"
              style={{ color: THEME.MutedGray }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable Categories & Tutorial Button */}
          <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto pr-0.5">
            {/* Standalone Tutorial Button */}
            <button
              type="button"
              onClick={() => setShowTutorialDialog(true)}
              className="flex w-full items-center justify-between rounded-[14px] px-3.5 py-3.5 text-left transition-colors hover:brightness-110 cursor-pointer"
              style={{
                backgroundColor: THEME.PanelBgElevated,
                border: '1px solid rgba(100, 181, 246, 0.45)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
                  style={{
                    backgroundColor: 'rgba(100, 181, 246, 0.15)',
                    border: '1px solid rgba(100, 181, 246, 0.4)',
                  }}
                >
                  <BookOpen className="h-[18px] w-[18px]" style={{ color: THEME.TutorialBlue }} />
                </div>
                <span className="text-[15px] font-bold" style={{ color: THEME.PaperWhite }}>
                  Tutorial
                </span>
              </div>
              <ArrowRight className="h-[18px] w-[18px]" style={{ color: THEME.TutorialBlue }} />
            </button>

            {/* Tutorial Categories */}
            {TUTORIAL_CATEGORIES.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                isExpanded={Boolean(expandedCategories[category.id])}
                expandedLessonId={expandedLessonId}
                onToggleExpand={() => toggleCategory(category.id)}
                onToggleLesson={toggleLesson}
              />
            ))}

            {/* Bottom Info Tip */}
            <div
              className="mt-1 flex items-center gap-2.5 rounded-[12px] p-3.5"
              style={{
                backgroundColor: 'rgba(10, 13, 16, 0.6)',
                border: `1px solid ${THEME.PanelEdge}`,
              }}
            >
              <Lightbulb className="h-5 w-5 shrink-0" style={{ color: THEME.BrassDim }} />
              <p
                className="font-mono text-[11.5px] leading-[16px]"
                style={{ color: THEME.MutedGray }}
              >
                Interactive lesson modules and step-by-step interactive demonstrations are in
                development.
              </p>
            </div>
          </div>
        </div>
      </BottomSheetShell>

      {/* Tutorial Placeholder Dialog */}
      {showTutorialDialog && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)' }}
          onClick={() => setShowTutorialDialog(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[380px] rounded-[20px] p-6 shadow-2xl"
            style={{
              backgroundColor: THEME.PanelBg,
              border: `1px solid ${THEME.PanelEdge}`,
            }}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" style={{ color: THEME.TutorialBlue }} />
              <h3 className="text-[16px] font-bold" style={{ color: THEME.PaperWhite }}>
                Tutorial
              </h3>
            </div>

            <p
              className="mt-3.5 whitespace-pre-line font-mono text-[12px] leading-[20px]"
              style={{ color: THEME.MutedGray }}
            >
              {
                'Interactive guided tutorial is currently in development.\n\nStep-by-step walkthroughs for gear mechanics, harmonic ratio tuning, and multi-layer inking will be available soon.'
              }
            </p>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowTutorialDialog(false)}
                className="rounded-lg px-3 py-1.5 font-mono text-[12px] font-bold hover:bg-white/5 cursor-pointer"
                style={{ color: THEME.BrassGold }}
              >
                GOT IT
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

interface CategoryCardProps {
  category: TutorialCategory;
  isExpanded: boolean;
  expandedLessonId: string | null;
  onToggleExpand: () => void;
  onToggleLesson: (id: string) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  isExpanded,
  expandedLessonId,
  onToggleExpand,
  onToggleLesson,
}) => {
  const IconComp =
    category.iconName === 'school'
      ? GraduationCap
      : category.iconName === 'settings'
        ? Settings
        : Sparkles;

  return (
    <div
      className="overflow-hidden rounded-[14px]"
      style={{
        backgroundColor: THEME.PanelBgElevated,
        border: `1px solid ${isExpanded ? `${category.accentColor}99` : THEME.PanelEdge}`,
      }}
    >
      {/* Category Header */}
      <button
        type="button"
        onClick={onToggleExpand}
        className="flex w-full items-center justify-between gap-2 px-3.5 py-3 text-left hover:bg-white/[0.02] cursor-pointer"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
            style={{
              backgroundColor: `${category.accentColor}26`,
              border: `1px solid ${category.accentColor}66`,
            }}
          >
            <IconComp className="h-[18px] w-[18px]" style={{ color: category.accentColor }} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-bold" style={{ color: THEME.PaperWhite }}>
                {category.title}
              </span>
              <span
                className="rounded-[6px] px-1.5 py-0.5 font-mono text-[10px] font-semibold"
                style={{
                  backgroundColor: THEME.CanvasBg,
                  color: category.accentColor,
                }}
              >
                {category.lessons.length} lessons
              </span>
            </div>
            <div className="text-[11.5px]" style={{ color: THEME.MutedGray }}>
              {category.subtitle}
            </div>
          </div>
        </div>

        <ChevronDown
          className="h-[22px] w-[22px] shrink-0 transition-transform duration-200"
          style={{
            color: isExpanded ? category.accentColor : THEME.MutedGray,
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {/* Expandable Lessons List */}
      {isExpanded && (
        <div
          className="flex flex-col gap-2 px-3 py-2.5"
          style={{ backgroundColor: 'rgba(10, 13, 16, 0.4)' }}
        >
          {category.lessons.map((lesson) => (
            <LessonRowCard
              key={lesson.id}
              lesson={lesson}
              accentColor={category.accentColor}
              isExpanded={expandedLessonId === lesson.id}
              onToggle={() => onToggleLesson(lesson.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface LessonRowCardProps {
  lesson: LessonItem;
  accentColor: string;
  isExpanded: boolean;
  onToggle: () => void;
}

const LessonRowCard: React.FC<LessonRowCardProps> = ({
  lesson,
  accentColor,
  isExpanded,
  onToggle,
}) => {
  return (
    <div
      className="rounded-[10px]"
      style={{
        backgroundColor: isExpanded
          ? 'rgba(18, 22, 27, 0.95)'
          : 'rgba(22, 28, 34, 0.85)',
        border: `1px solid ${
          isExpanded ? `${accentColor}73` : 'rgba(31, 38, 46, 0.7)'
        }`,
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 p-2.5 text-left cursor-pointer"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <div
            className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[6px] font-mono text-[11px] font-bold"
            style={{
              backgroundColor: `${accentColor}1F`,
              border: `1px solid ${accentColor}4D`,
              color: accentColor,
            }}
          >
            {lesson.number}
          </div>

          <div className="min-w-0">
            <div
              className="text-[13px] font-semibold"
              style={{ color: THEME.PaperWhite }}
            >
              {lesson.title}
            </div>
            <div className="text-[11px]" style={{ color: THEME.MutedGray }}>
              {lesson.summary}
            </div>
          </div>
        </div>

        <ChevronDown
          className="h-[18px] w-[18px] shrink-0 transition-transform duration-200"
          style={{
            color: isExpanded ? accentColor : THEME.MutedGray,
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {isExpanded && (
        <div className="px-2.5 pb-2.5">
          <div
            className="whitespace-pre-line rounded-[8px] p-2.5 font-mono text-[12px] leading-[17px]"
            style={{
              backgroundColor: THEME.CanvasBg,
              border: `1px solid ${THEME.PanelEdge}`,
              color: 'rgba(231, 227, 218, 0.85)',
            }}
          >
            {lesson.placeholderContent}
          </div>
        </div>
      )}
    </div>
  );
};
