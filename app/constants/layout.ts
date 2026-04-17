import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Guideline sizes are based on standard ~5" screen mobile device (iPhone 11/12/13 size roughly)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

/**
 * Scale horizontal values (width, marginHorizontal, paddingHorizontal, etc.)
 */
export const scale = (size: number) => (SCREEN_WIDTH / guidelineBaseWidth) * size;

/**
 * Scale vertical values (height, marginVertical, paddingVertical, etc.)
 */
export const verticalScale = (size: number) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;

/**
 * Moderately scale values (font sizes, border radius, etc.)
 * factor ranges from 0 to 1, where 0 is no scaling and 1 is full scaling.
 */
export const moderateScale = (size: number, factor = 0.5) => 
    size + (scale(size) - size) * factor;

/**
 * Scale text sizes with PixelRatio consideration
 */
export const fontScale = (size: number) => 
    PixelRatio.getFontScale() * moderateScale(size);

export const IS_IOS = Platform.OS === 'ios';
export const IS_ANDROID = Platform.OS === 'android';

export default {
    window: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
    },
    isSmallDevice: SCREEN_WIDTH < 375,
    scale,
    verticalScale,
    moderateScale,
    fontScale,
    IS_IOS,
    IS_ANDROID,
};
