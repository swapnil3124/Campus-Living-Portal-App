import React from 'react';
import { 
    KeyboardAvoidingView, 
    ScrollView, 
    TouchableWithoutFeedback, 
    Keyboard, 
    Platform, 
    StyleSheet, 
    View,
    ViewStyle,
    StyleProp
} from 'react-native';
import { IS_IOS } from '@/constants/layout';

interface KeyboardWrapperProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    contentContainerStyle?: StyleProp<ViewStyle>;
    scrollEnabled?: boolean;
}

/**
 * A wrapper component that handles keyboard avoiding behavior and 
 * keyboard dismissal when tapping outside of inputs.
 */
export const KeyboardWrapper: React.FC<KeyboardWrapperProps> = ({ 
    children, 
    style, 
    contentContainerStyle,
    scrollEnabled = true 
}) => {
    const Container = scrollEnabled ? ScrollView : View;
    
    return (
        <KeyboardAvoidingView
            behavior={IS_IOS ? 'padding' : 'height'}
            style={[styles.container, style]}
            keyboardVerticalOffset={IS_IOS ? 64 : 0}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <Container 
                    style={styles.flex} 
                    contentContainerStyle={contentContainerStyle}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {children}
                </Container>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    flex: {
        flex: 1,
    },
});
