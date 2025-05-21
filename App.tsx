import React from 'react';
import type {PropsWithChildren} from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  PermissionsAndroid,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, StackScreenProps } from '@react-navigation/stack';
import {
  Colors,
  DebugInstructions,
  Header,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';
import RNFS from 'react-native-fs';

//telas
import  HomeScreen  from './screens/HomeScreen';
import EditorScreen from './screens/EditScreen';

const criarPastaDotAll = async () => {
  const path = `${RNFS.DownloadDirectoryPath}/DotAll`;

  try {
    const exists = await RNFS.exists(path);
    if (!exists) {
      await RNFS.mkdir(path);
      console.log('Pasta DotAll criada em Downloads:', path);
    } else {
      console.log('Pasta DotAll já existe em Downloads:', path);
    }
  } catch (error) {
    console.error('Erro ao criar a pasta:', error);
    Alert.alert(
      'Erro',
      'Não foi possível criar a pasta DotAll. Verifique as permissões.',
      [
        {
          text: 'OK',
          onPress: () => console.log('OK Pressed'),
        },
      ],
    );
  }
};


export type RootStackParamList = {
  HomeScreen: undefined;
  EditorScreen:  {
    nomeArquivo?: string;
    conteudo?: string;
  };
};

const Stack = createStackNavigator<RootStackParamList>();

const App = () => {
  React.useEffect(() => {
    const initApp = async () => {
      await criarPastaDotAll();
    };

    initApp();
  }, []);

  return (
    <NavigationContainer>
      <StatusBar barStyle={'light-content'} />
      <Stack.Navigator >
        <Stack.Screen options={{ headerShown: false }} name="HomeScreen" component={HomeScreen} />
        <Stack.Screen name="EditorScreen" component={EditorScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;