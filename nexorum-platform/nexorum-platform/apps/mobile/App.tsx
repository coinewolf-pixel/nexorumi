import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text } from 'react-native';

import HomeScreen from './src/screens/Home';
import MarketsScreen from './src/screens/Markets';
import ProfileScreen from './src/screens/Profile';
import WalletScreen from './src/screens/Wallet';
import LeaderboardScreen from './src/screens/Leaderboard';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: { backgroundColor: '#13131f', borderTopColor: 'rgba(255,255,255,0.1)', paddingBottom: 8, paddingTop: 8 },
            tabBarActiveTintColor: '#6366f1',
            tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
          }}>
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Markets" component={MarketsScreen} />
          <Tab.Screen name="Wallet" component={WalletScreen} />
          <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
          <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
      </NavigationContainer>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
