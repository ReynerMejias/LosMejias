import { useState, useEffect } from "react";
import { View, ScrollView, TouchableWithoutFeedback } from "react-native";
import {
  Appbar,
  Card,
  Avatar,
  useTheme,
  ActivityIndicator,
} from "react-native-paper";
import { getLugares } from "../api";

export default function Realizar({ navigation }) {
  const { colors } = useTheme();
  const [lugares, setLugares] = useState([]);
  const [loading, setLoading] = useState(true);

  const AvatarLetter = ({ letter }) => <Avatar.Text size={45} label={letter} />;

  // Función para manejar el toque en la card
  const handleCardPress = (lugar) => {
    navigation.navigate("Lecturas", {
      lugar,
    });
  };

  useEffect(() => {
    const fetchLugares = async () => {
      try {
        const data = await getLugares();
        setLugares(data);
      } catch (error) {
        navigation.navigate("InicioSesion");
        console.error("fetchLugares error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLugares();
  }, []);

  return (
    <ScrollView>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={loading ? "Cargando..." : "Elegir lugar"} />
      </Appbar.Header>
      <View
        style={{
          gap: 16,
          padding: 16,
        }}
      >
        {loading && <ActivityIndicator />}
        {!loading && lugares.length === 0 && (
          <Card>
            <Card.Title title="No hay lugares disponibles" />
          </Card>
        )}
        {lugares.map((lugar) => (
          <TouchableWithoutFeedback
            key={lugar.id} // Asegúrate de que cada lugar tenga una propiedad 'id' única
            onPress={() => handleCardPress(lugar)} // Aquí puedes usar el nombre o cualquier campo del lugar
          >
            <Card style={{ backgroundColor: colors.surface, borderRadius: 12, elevation: 2, }}>
              <Card.Title
                title={lugar.nombre}
                subtitle={`Lectura: ${lugar.dia} de cada mes`}
                left={() => <AvatarLetter letter={lugar.nombre[0]} />}
              />
            </Card>
          </TouchableWithoutFeedback>
        ))}
      </View>
    </ScrollView>
  );
}
