export type GuideScope = 'home' | 'shops' | 'tour';
export interface GuidePreferences {
  hasSeen(scope: GuideScope): Promise<boolean>;
  markSeen(scope: GuideScope): Promise<void>;
}
