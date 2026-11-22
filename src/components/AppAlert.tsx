import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, fonts, spacing } from '../styles/theme';
import { AppButton } from './AppButton';

type Button = { text: string; onPress?: () => void; variant?: 'primary' | 'secondary' | 'danger' };

type Props = {
    visible: boolean;
    title: string;
    message?: string;
    buttons: Button[];
    onRequestClose: () => void;
};

export function AppAlert({ visible, title, message, buttons, onRequestClose }: Props) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
            <View style={styles.backdrop}>
                <View style={styles.box}>
                    <Text style={styles.title}>{title}</Text>
                    {message && <Text style={styles.message}>{message}</Text>}
                    <View style={{ width: '100%', marginTop: spacing.md }}>
                        {buttons.map((b, i) => (
                            <AppButton
                                key={i}
                                title={b.text}
                                variant={b.variant ?? 'secondary'}
                                onPress={() => { b.onPress?.(); onRequestClose(); }}
                            />
                        ))}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
    box: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.gold,
        borderRadius: 6,
        padding: spacing.lg,
        alignItems: 'center',
    },
    title: { fontFamily: fonts.display, fontSize: 19, color: colors.gold, textAlign: 'center' },
    message: { fontFamily: fonts.body, fontSize: 14, color: colors.inkMuted, textAlign: 'center', marginTop: spacing.sm },
});