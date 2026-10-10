import { ImageBackground, StyleSheet, View } from "react-native";

type Props = { children: React.ReactNode; };

export function ScreenBackground({ children }: Props) {
    return (
        <ImageBackground
            source={require('../assets/images/background.jpg')}
            resizeMode="cover"
            style={styles.background}>
            <View style={styles.overlay}>
                {children}
            </View>
        </ImageBackground>
    )
}

const styles = StyleSheet.create({
    background: { flex: 1 },
    overlay: { flex: 1, backgroundColor: 'rgba(27, 20, 15, 0.5)' },
});