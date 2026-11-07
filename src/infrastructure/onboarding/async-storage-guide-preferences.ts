import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GuidePreferences } from '../../application/onboarding/ports';

export const guidePreferences: GuidePreferences = {
  async hasSeen(scope) { return await AsyncStorage.getItem(`@robia/guide/${scope}/v2`) === 'seen'; },
  async markSeen(scope) { await AsyncStorage.setItem(`@robia/guide/${scope}/v2`, 'seen'); },
};
