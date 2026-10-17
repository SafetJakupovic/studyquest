// za greske u renderovanju, ne unutar onPress ili async
import { Component, ReactNode } from 'react';
import { View, Text } from 'react-native';
import { colors, fonts, spacing } from '../styles/theme';
import { AppButton } from './AppButton';

type Props = { children: ReactNode };
type State = { hasError: boolean; message: string };

export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, message: '' };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, message: error.message };
    }

    componentDidCatch(error: Error, info: any) {
        console.log('ErrorBoundary uhvatio:', error, info);
    }

    handleReset = () => {
        this.setState({ hasError: false, message: '' });
    };

    render() {
        if (this.state.hasError) {
            return (
                <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center', padding: spacing.lg }}>
                    <Text style={{ fontFamily: fonts.display, fontSize: 22, color: colors.gold, textAlign: 'center' }}>
                        Nešto nije u redu
                    </Text>
                    <Text style={{ fontFamily: fonts.body, color: colors.inkMuted, textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.lg }}>
                        {this.state.message}
                    </Text>
                    <AppButton title="Pokušaj ponovo" onPress={this.handleReset} />
                </View>
            );
        }
        return this.props.children;
    }
}