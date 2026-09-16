/**
 * @format
 */

/*
 * Must be the first import in the app. Gesture Handler patches the
 * touch pipeline as a side effect of being loaded, so anything that
 * renders before this line would be wired to the unpatched one.
 */
import 'react-native-gesture-handler';

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
