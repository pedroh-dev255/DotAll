import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { FloatingAction } from 'react-native-floating-action';
import RNFS from 'react-native-fs';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'HomeScreen'>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

const actions = [
  {
    text: 'Novo Texto Simples',
    icon: require('../assets/plus.png'),
    name: 'bt_add',
  },
];

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [arquivos, setArquivos] = useState<RNFS.ReadDirItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selecionando, setSelecionando] = useState(false);
  const [selecionados, setSelecionados] = useState<string[]>([]);

  const pasta = `${RNFS.DownloadDirectoryPath}/DotAll`;

  const carregarArquivos = async () => {
    try {
      const files = await RNFS.readDir(pasta);
      setArquivos(files);
    } catch (error) {
      console.error('Erro ao listar arquivos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    carregarArquivos();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    carregarArquivos();
    setSelecionando(false);
    setSelecionados([]);
  };

  const toggleSelecionar = (path: string) => {
    if (selecionados.includes(path)) {
      setSelecionados(selecionados.filter(p => p !== path));
    } else {
      setSelecionados([...selecionados, path]);
    }
  };

  const deletarSelecionados = async () => {
    Alert.alert('Confirmar exclusão', 'Deseja realmente deletar os arquivos selecionados?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Deletar',
        style: 'destructive',
        onPress: async () => {
          for (const path of selecionados) {
            try {
              await RNFS.unlink(path);
            } catch (err) {
              console.error('Erro ao deletar:', path, err);
            }
          }
          setSelecionando(false);
          setSelecionados([]);
          carregarArquivos();
        },
      },
    ]);
  };

  const duplicarSelecionados = async () => {
    for (const path of selecionados) {
      const nomeOriginal = path.split('/').pop();
      const novoNome = nomeOriginal?.replace(/(\.[^.]+)?$/, `_copia$1`);
      const novoPath = `${pasta}/${novoNome}`;
      try {
        await RNFS.copyFile(path, novoPath);
      } catch (err) {
        console.error('Erro ao duplicar:', path, err);
      }
    }
    setSelecionando(false);
    setSelecionados([]);
    carregarArquivos();
  };

  const renderItem = ({ item }: { item: RNFS.ReadDirItem }) => {
    const isImage = item.name.match(/\.(jpg|jpeg|png|gif)$/i);
    const selecionado = selecionados.includes(item.path);

    return (
      <TouchableOpacity
        style={[styles.card, selecionado && styles.cardSelecionado]}
        onLongPress={() => {
          setSelecionando(true);
          toggleSelecionar(item.path);
        }}
        onPress={async () => {
            if (selecionando) {
                toggleSelecionar(item.path);
            } else {
                try {
                    const conteudo = await RNFS.readFile(item.path, 'utf8');
                    navigation.navigate('EditorScreen', {
                    nomeArquivo: item.name,
                    conteudo,
                    });
                } catch (err) {
                    console.error('Erro ao abrir arquivo:', err);
                    Alert.alert('Erro', 'Não foi possível abrir o arquivo.');
                }

            }
            }
        }
      >
        {isImage ? (
          <Image
            source={{ uri: 'file://' + item.path }}
            style={styles.preview}
            resizeMode="cover"
          />
        ) : (
          <Image
            source={require('../assets/file-icon.png')}
            style={styles.preview}
            resizeMode="contain"
          />
        )}
        <Text style={styles.title}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {selecionando && (
        <View style={styles.selecaoBar}>
          <TouchableOpacity style={styles.btnAcao} onPress={duplicarSelecionados}>
            <Text style={styles.btnTexto}>Duplicar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btnAcao, { backgroundColor: '#e74c3c' }]} onPress={deletarSelecionados}>
            <Text style={styles.btnTexto}>Deletar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btnAcao, { backgroundColor: '#b0afab' }]} onPress={() => setSelecionando(false)}>
            <Text style={styles.btnTexto}>cancelar</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#000" />
      ) : arquivos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhum arquivo encontrado.</Text>
        </View>
      ) : (
        <FlatList
          data={arquivos}
          keyExtractor={(item) => item.path}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <FloatingAction
        actions={actions}
        floatingIcon={
          <Image source={require('../assets/menu.png')} style={{ width: 80, height: 80 }} />
        }
        onPressItem={(name) => {
            if (name === 'bt_add') {
                navigation.navigate({ name: 'EditorScreen', params: {} });
            }
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ebebff',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#f3f3f3',
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    elevation: 2,
    alignItems: 'center',
  },
  cardSelecionado: {
    borderColor: '#007bff',
    borderWidth: 2,
  },
  preview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#888',
  },
  selecaoBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#ddd',
    padding: 10,
  },
  btnAcao: {
    backgroundColor: '#2ecc71',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnTexto: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default HomeScreen;
