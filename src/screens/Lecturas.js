import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useCallback, useEffect } from "react";
import { View, ScrollView, TouchableWithoutFeedback, Text } from "react-native";
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
  const [filteredClientes, setFilteredClientes] = useState([]); // Lista filtrada
  const [search, setSearch] = useState(""); // Estado de búsqueda
  const route = useRoute();
  const { lugar } = route.params;
  const [loading, setLoading] = useState(true);
  const [mostrarCompletados, setMostrarCompletados] = useState(true);
  let clientesCompletados = 0;

  const mesHoy = new Date().getMonth() + 1;

  // Manejar la selección de un cliente
  const handleCardPress = (clienteLugarCompletado) => {
    navigation.navigate("Lectura", { clienteLugarCompletado });
  };

  // Cargar preferencia almacenada
  useEffect(() => {
    const cargarPreferencia = async () => {
      const valorGuardado = await AsyncStorage.getItem("mostrarCompletados");
      if (valorGuardado !== null) {
        setMostrarCompletados(valorGuardado === "true");
      }
    };
    cargarPreferencia();
  }, []);

  // Guardar preferencia cuando cambia
  const toggleMostrarCompletados = async () => {
    const nuevoEstado = !mostrarCompletados;
    setMostrarCompletados(nuevoEstado);
    await AsyncStorage.setItem("mostrarCompletados", nuevoEstado.toString());
  };

  const fetchClientes = async () => {
    try {
      const data = await getClientes(lugar.nombre);
      setClientes(data);
      setFilteredClientes(data); // Inicializa la lista filtrada con todos los clientes
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

  // Filtrar clientes en tiempo real según búsqueda
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

  return (
    <ScrollView>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={loading ? "Cargando..." : lugar.nombre} />
        <Appbar.Action
          icon={
            mostrarCompletados ? "bookmark-check" : "bookmark-check-outline"
          }
          onPress={toggleMostrarCompletados}
        />
      </Appbar.Header>

      <View style={{ padding: 16 }}>
        {/* 🔍 Barra de búsqueda */}
        <Searchbar
          placeholder="Buscar cliente..."
          value={search}
          onChangeText={setSearch}
          style={{ marginBottom: 10 }}
        />

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
              parseInt(cliente.ultima_lectura.fecha_lectura.split("-")[1]) >=
                mesHoy;

            if (isCompletada) {
              clientesCompletados++;
            }

            if (!mostrarCompletados && isCompletada) {
              return null;
            }

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
                    subtitle={`Medidor: ${cliente.medidor}`}
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
        <Text style={{ color: colors.text, textAlign: "center" }}>
          {clientesCompletados} de {Clientes.length} clientes completados
        </Text>
      </View>
    </ScrollView>
  );
}
