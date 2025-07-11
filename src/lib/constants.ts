// タスク関連の定数
export const TASK_CONSTANTS = {
  DEFAULT_PRIORITY: 'medium' as const,
  DEFAULT_CATEGORY: 'other',
  SAVE_DELAY_MS: 100,
  DEFAULT_CONTENT_PLACEHOLDER: `# メモ

## 今日やること
- [ ] タスク1
- [ ] タスク2

## メモ
**重要**: 
*参考*: 

---

Markdownで自由に書けます！`,
  HABIT_CONTENT_PLACEHOLDER: `# 習慣メモ

## 今日やること
- [ ] 習慣1
- [ ] 習慣2

## メモ
**重要**: 
*参考*: 

---

Markdownで自由に書けます！`
} as const;

// プラン別制限
export const PLAN_LIMITS = {
  GUEST: { maxHabits: 0, maxStreakDays: 0 },
  FREE: { maxHabits: 3, maxStreakDays: 14 },
  PREMIUM: { maxHabits: Infinity, maxStreakDays: Infinity }
} as const;

// モーダル関連の定数
export const MODAL_CONSTANTS = {
  MOBILE_HEADER_PADDING: 'py-3 pt-safe',
  DESKTOP_HEADER_PADDING: 'py-4',
  MOBILE_CONTENT_PADDING: 'pb-12',
  MOBILE_MAX_HEIGHT: 'max-h-[calc(100vh-200px)]',
  DESKTOP_MAX_HEIGHT: 'max-h-[calc(90vh-120px)]'
} as const; 