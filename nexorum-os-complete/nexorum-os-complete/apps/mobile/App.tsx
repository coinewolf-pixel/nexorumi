import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HomeScreen from './src/screens/HomeScreen';
import MarketsScreen from './src/screens/MarketsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import WalletScreen from './src/screens/WalletScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              const icons: Record<string, string> = {
                Home: focused ? 'home' : 'home-outline',
                Markets: focused ? 'game-controller' : 'game-controller-outline',
                Leaderboard: focused ? 'trophy' : 'trophy-outline',
                Wallet: focused ? 'wallet' : 'wallet-outline',
                Profile: focused ? 'person' : 'person-outline',
              };
              return <Ionicons name={icons[route.name] as any} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#6366f1',
            tabBarInactiveTintColor: '#888',
            tabBarStyle: { backgroundColor: '#0a0a0a', borderTopColor: '#222' },
            headerStyle: { backgroundColor: '#0a0a0a' },
            headerTintColor: '#fff',
          })}
        >
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Markets" component={MarketsScreen} />
          <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
          <Tab.Screen name="Wallet" component={WalletScreen} />
          <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
      </NavigationContainer>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
