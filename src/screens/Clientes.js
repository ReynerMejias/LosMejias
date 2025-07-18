import { useState, useEffect } from "react";
import { View, ScrollView, TouchableWithoutFeedback, Text } from "react-native";
import {
  Appbar,
  Card,
  Avatar,
  useTheme,
  ActivityIndicator,
  Searchbar,
} from "react-native-paper";
import { getClientes, getLugar } from "../api";

export default function Clientes({ navigation }) {
  const { colors } = useTheme();
  const AvatarLetter = ({ letter }) => <Avatar.Text size={45} label={letter} />;

  const [clientes, setClientes] = useState([]);
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [lugares, setLugares] = useState({});

  const handleCardPress = (cliente) => {
    navigation.navigate("Solicitud", { cliente });
  };

  const fetchClientesLugar = async () => {
    try {
      const data = await getClientes("");
      setClientes(data);
      setFilteredClientes(data);

      const lugaresData = {};
      for (const cliente of data) {
        if (!lugaresData[cliente.lugar]) {
          lugaresData[cliente.lugar] = await getLugar(cliente.lugar);
        }
      }
      setLugares(lugaresData);
    } catch (error) {
      navigation.navigate("InicioSesion");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientesLugar();
  }, []);

  useEffect(() => {
    if (search.trim() === "") {
      setFilteredClientes(clientes);
    } else {
      const filtered = clientes.filter(
        (cliente) =>
          cliente.nombre.toLowerCase().includes(search.toLowerCase()) ||
          cliente.lote.toLowerCase().includes(search.toLowerCase()) ||
          cliente.medidor.toString().includes(search)
      );
      setFilteredClientes(filtered);
    }
  }, [search, clientes]);

  return (
    <ScrollView>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={"Elige un cliente"} />
      </Appbar.Header>

      <View style={{ padding: 16 }}>
        <Searchbar
          placeholder="Buscar cliente..."
          style={{ marginBottom: 10 }}
          value={search}
          onChangeText={setSearch}
        />
        {loading ? (
          <ActivityIndicator />
        ) : filteredClientes.length === 0 ? (
          <Text style={{ color: colors.text, textAlign: "center" }}>
            No hay clientes.
          </Text>
        ) : (
          filteredClientes.map((cliente) => (
            <TouchableWithoutFeedback
              key={cliente.id}
              onPress={() => handleCardPress(cliente)}
            >
              <Card
                style={{ backgroundColor: colors.surface, marginBottom: 10 }}
              >
                <Card.Title
                  title={cliente.nombre}
                  subtitle={cliente.lote}
                  left={() => <AvatarLetter letter={cliente.nombre[0]} />}
                />
                <Card.Content>
                  <Text style={{ color: colors.text }}>
                    Medidor: {cliente.medidor}
                  </Text>
                  <Text style={{ color: colors.text }}>
                    Lugar: {lugares[cliente.lugar]?.nombre || "Cargando..."}
                  </Text>
                </Card.Content>
              </Card>
            </TouchableWithoutFeedback>
          ))
        )}
      </View>
    </ScrollView>
  );
}
