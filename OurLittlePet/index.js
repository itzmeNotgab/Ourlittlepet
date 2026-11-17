import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './src/App';
import { name } from './app.json';

// Required so FCM can deliver while the app is in the background.
messaging().setBackgroundMessageHandler(async () => {});

AppRegistry.registerComponent(name, () => App);
