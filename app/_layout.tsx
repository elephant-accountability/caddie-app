import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { colors } from '../src/theme/colors';
import { QueueProvider } from '../src/context/QueueContext';
import { ConversationProvider } from '../src/context/ConversationContext';
import { AuthProvider, useAuth } from '../src/auth/AuthContext';
import { LoginScreen } from '../src/components/LoginScreen';
import { View } from 'react-native';
import { useShareCapture } from '../src/hooks/useShareCapture';
import { useCallCapture } from '../src/hooks/useCallCapture';
import { PostCallCapture } from '../src/components/PostCallCapture';
import { useOnboardingGate } from '../src/onboarding/useOnboardingGate';
import SweepScreen from '../src/onboarding/SweepScreen';

function AppContent() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Listen for share extension deep links
  useShareCapture();

  // Listen for phone call end events
  const { pendingCall, isModalVisible, dismissModal } = useCallCapture();

  // First-run onboarding gate
  const { needsOnboarding, completeOnboarding } = useOnboardingGate();

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: colors.navy }} />;
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Show sweep screen on first run (after auth, before main app)
  if (needsOnboarding) {
    return (
      <SweepScreen
        repId={user?.id ?? "unknown"}
        onComplete={completeOnboarding}
      />
    );
  }

  return (
    <QueueProvider>
      <ConversationProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.navy },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="(tabs)" />
        </Stack>
        <PostCallCapture
          visible={isModalVisible}
          callInfo={pendingCall}
          onDismiss={dismissModal}
        />
      </ConversationProvider>
    </QueueProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.navy }}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
