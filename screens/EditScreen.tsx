import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  NativeSyntheticEvent,
  TextInputSelectionChangeEventData,
} from 'react-native';
import RNFS from 'react-native-fs';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { useFocusEffect } from '@react-navigation/native';
import { TouchableOpacity } from 'react-native-gesture-handler';

type EditorScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EditorScreen'>;
type EditorScreenRouteProp = RouteProp<RootStackParamList, 'EditorScreen'>;

interface Props {
  navigation: EditorScreenNavigationProp;
  route: EditorScreenRouteProp;
}

const EditorScreen: React.FC<Props> = ({ navigation, route }) => {
  const [fileName, setFileName] = useState(route.params?.nomeArquivo || '');
  const [originalFileName] = useState(route.params?.nomeArquivo || '');
  const [content, setContent] = useState(route.params?.conteudo || '');
  const [isSaved, setIsSaved] = useState(!!route.params?.nomeArquivo);
  const [selection, setSelection] = useState({ start: 0, end: 0 });


  const pasta = `${RNFS.DownloadDirectoryPath}/DotAll`;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <TextInput
            value={fileName}
            onChangeText={setFileName}
            placeholder="Nome do arquivo"
            placeholderTextColor="#888"
            style={styles.navbarInput}
        />
      ),
      headerRight: () => (
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveBtn}>Salvar</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, fileName, content]);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (!isSaved && (fileName !== '' || content !== '')) {
          Alert.alert('Descartar alterações?', 'Você tem alterações não salvas.', [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Descartar',
              style: 'destructive',
              onPress: () => navigation.goBack(),
            },
          ]);
          return true; // intercepta o back
        }
        return false; // permite voltar
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => backHandler.remove();
    }, [fileName, content, isSaved])
  );
  

  const handleSave = async () => {
    if (!fileName) {
      Alert.alert('Erro', 'Informe um nome para o arquivo.');
      return;
    }

    const nomeComExtensao = fileName.includes('.') ? fileName : `${fileName}.txt`;
    const path = `${pasta}/${nomeComExtensao}`;
    const originalComExtensao = originalFileName.includes('.') ? originalFileName : `${originalFileName}.txt`;
    const originalPath = `${pasta}/${originalComExtensao}`;

    try {
      const exists = await RNFS.exists(pasta);
      if (!exists) await RNFS.mkdir(pasta);

      if (originalFileName && originalFileName !== fileName && await RNFS.exists(originalPath)) {
        await RNFS.unlink(originalPath);
      }

      await RNFS.writeFile(path, content, 'utf8');
      setIsSaved(true);
      Alert.alert('Salvo com sucesso!', `Arquivo: ${nomeComExtensao}`, [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err) {
      console.error('Erro ao salvar arquivo:', err);
      Alert.alert('Erro', 'Não foi possível salvar o arquivo.');
    }
  };

  

  const handleTabPress = () => {
    const before = content.slice(0, selection.start);
    const after = content.slice(selection.end);
    const newText = `${before}\t${after}`;
    const cursorPos = selection.start + 1;

    setContent(newText);
    setSelection({ start: cursorPos, end: cursorPos });
  };

  const handleSelectionChange = (
    e: NativeSyntheticEvent<TextInputSelectionChangeEventData>
  ) => {
    setSelection(e.nativeEvent.selection);
  };

  return (
    <>
    <View style={styles.container}>
        
      <View style={styles.editorContainer}>
        {/*
        <View style={styles.lineNumbers}>
          {content.split('\n').map((_, index) => (
            <Text key={index} style={styles.lineNumber}>
              {index + 1}
            </Text>
          ))}
        </View>*/}


        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <TextInput
            multiline
            textAlignVertical="top"
            placeholder="Digite aqui seu texto..."
            value={content}
            onChangeText={setContent}
            onSelectionChange={handleSelectionChange}
            selection={selection}
            style={styles.textArea}
          />
        </ScrollView>
      </View>

      <TouchableOpacity onPress={handleTabPress} style={styles.button}>
        <Text style={styles.buttonText}>Tab</Text>
      </TouchableOpacity>
    </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ebebff',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputNome: {
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingVertical: 4,
  },
  textArea: {
    flex: 1,
    padding: 16,
    paddingTop: 5,
    fontSize: 16,
    fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier',
    color: '#333',
  },
  navbarInput: {
    fontSize: 20,
    paddingVertical: 2,
    width: 180,
    fontWeight: 'bold',
  },
  saveBtn: {
    color: '#007bff',
    fontWeight: 'bold',
    fontSize: 16,
    paddingRight: 16,
  },

  editorContainer: {
    flexDirection: 'row',
    flex: 1,
  },  
  lineNumbers: {
    width: 40,
    backgroundColor: '#f0f0f0',
    paddingLeft: 0,
    alignItems: 'flex-end',
  },
  lineNumber: {
    height: 20,
    fontSize: 18,
    color: '#666',
    borderColor: '#ccc',
    borderWidth: 1,
  },
    bottomBar: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#f8f8f8',
    },
    button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    marginRight: 10,
    },
    buttonText: {
    fontSize: 16,
    color: '#333',
    },
});

export default EditorScreen;
