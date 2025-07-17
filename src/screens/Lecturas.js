import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useCallback, useEffect } from "react";
import {
  View,
  ScrollView,
  TouchableWithoutFeedback,
  Text,
  StatusBar,
  Platform,
} from "react-native";
import {
  Appbar,
  Card,
  Avatar,
  useTheme,
  ActivityIndicator,
  Searchbar,
} from "react-native-paper";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { getClientes } from "../api";

export default function Clientes({ navigation }) {
  const { colors } = useTheme();
  const AvatarLetter = ({ letter }) => <Avatar.Text size={45} label={letter} />;
  const AvatarCheck = (props) => (
    <Avatar.Icon {...props} size={45} icon="check" />
  );

  const [Clientes, setClientes] = useState([]);
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [search, setSearch] = useState("");
  const route = useRoute();
  const { lugar } = route.params;
  const [loading, setLoading] = useState(true);
  const [mostrarCompletados, setMostrarCompletados] = useState(true);
  let clientesCompletados = 0;
  const mesHoy = new Date().getMonth() + 1;

  const handleCardPress = (clienteLugarCompletado) => {
    navigation.navigate("Lectura", { clienteLugarCompletado });
  };

  useEffect(() => {
    const cargarPreferencia = async () => {
      const valorGuardado = await AsyncStorage.getItem("mostrarCompletados");
      if (valorGuardado !== null) {
        setMostrarCompletados(valorGuardado === "true");
      }
    };
    cargarPreferencia();
  }, []);

  const toggleMostrarCompletados = async () => {
    const nuevoEstado = !mostrarCompletados;
    setMostrarCompletados(nuevoEstado);
    await AsyncStorage.setItem("mostrarCompletados", nuevoEstado.toString());
  };

  const fetchClientes = async () => {
    try {
      const data = await getClientes(lugar.nombre);
      setClientes(data);
      setFilteredClientes(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, [lugar]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchClientes();
    }, [lugar])
  );

  useEffect(() => {
    if (search.trim() === "") {
      setFilteredClientes(Clientes);
    } else {
      const filtered = Clientes.filter(
        (cliente) =>
          cliente.nombre.toLowerCase().includes(search.toLowerCase()) ||
          cliente.medidor.toString().includes(search) ||
          cliente.lote.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredClientes(filtered);
    }
  }, [search, Clientes]);

  const statusBarHeight =
    Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0;

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      {/* 🔷 Appbar Header */}
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={loading ? "Cargando..." : lugar.nombre} />
        <Appbar.Action
          icon={mostrarCompletados ? "bookmark-check" : "bookmark-check-outline"}
          onPress={toggleMostrarCompletados}
        />
      </Appbar.Header>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* 🔍 Buscador */}
        <Searchbar
          placeholder="Buscar cliente..."
          value={search}
          onChangeText={setSearch}
          style={{ marginBottom: 10 }}
        />

        {/* ✅ Estado de lecturas (ahora se ve justo después del buscador) */}
        {!loading && filteredClientes.length > 0 && (
          <View
            style={{
              marginBottom: 16,
              padding: 12,
              backgroundColor: colors.card,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.primary,
              elevation: 2,
            }}
          >
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: "600" }}>
              Estado de lecturas
            </Text>
            <Text style={{ color: colors.text, fontSize: 14, marginTop: 4 }}>
              {
                (clientesCompletados = filteredClientes.filter((cliente) => {
                  const isCompletada =
                    cliente.ultima_lectura?.fecha_lectura &&
                    parseInt(cliente.ultima_lectura.fecha_lectura.split("-")[1]) >= mesHoy;
                  return isCompletada;
                }).length)
              }
              {" de "}
              {filteredClientes.length} clientes ya han registrado su lectura este mes.
            </Text>
          </View>
        )}

        {/* 📋 Lista de clientes */}
        {loading ? (
          <ActivityIndicator />
        ) : filteredClientes.length === 0 ? (
          <Text style={{ color: colors.text, textAlign: "center" }}>
            No hay clientes en este lugar.
          </Text>
        ) : (
          filteredClientes.map((cliente, index) => {
            const isCompletada =
              cliente.ultima_lectura?.fecha_lectura &&
              parseInt(cliente.ultima_lectura.fecha_lectura.split("-")[1]) >= mesHoy;

            if (!mostrarCompletados && isCompletada) return null;

            return (
              <TouchableWithoutFeedback
                key={index}
                onPress={() => handleCardPress([cliente, lugar, isCompletada])}
              >
                <Card
                  style={{
                    backgroundColor: colors.surface,
                    borderWidth: isCompletada ? 2 : 0,
                    borderColor: isCompletada ? colors.primary : "transparent",
                    marginBottom: 10,
                  }}
                >
                  <Card.Title
                    title={`${cliente.nombre} "${cliente.lote}"`}
                    subtitle={
                      cliente.ultima_lectura
                        ? `Medidor: ${cliente.medidor} (últ.: ${cliente.ultima_lectura.lectura})`
                        : `Medidor: ${cliente.medidor} (últ.: ${cliente.metros})`
                    }
                    left={() =>
                      isCompletada ? (
                        <AvatarCheck />
                      ) : (
                        <AvatarLetter letter={cliente.nombre[0]} />
                      )
                    }
                  />
                  {isCompletada && (
                    <Card.Content>
                      <Text
                        style={{
                          color: colors.primary,
                          fontStyle: "italic",
                          textAlign: "right",
                        }}
                      >
                        Completado
                      </Text>
                    </Card.Content>
                  )}
                </Card>
              </TouchableWithoutFeedback>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
