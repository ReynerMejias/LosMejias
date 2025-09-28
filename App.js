import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { MD3DarkTheme as DefaultTheme, PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import InicioSesion from "./src/screens/InicioSesion";
import Bienvenida from "./src/screens/Bienvenida";
import Solicitud from "./src/screens/Solicitud";
import EditarPerfil from "./src/screens/EditarPerfil";
import Realizar from "./src/screens/Realizar";
import Lecturas from "./src/screens/Lecturas";
import Lectura from "./src/screens/Lectura";
import Correo from "./src/screens/Correo";
import ImpresoraBT from "./src/screens/ImpresoraBT";

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#65558F",
    onPrimary: "#ffffff",
    secondary: "rgba(127, 128, 177, 0.54)",
    accent: "#03dac6",
    background: "#121212",
    surface: "#1f1f1f",
    text: "#ffffff",
    error: "#cf6679",
    onSurface: "#e0e0e0",
  },
};

const Stack = createStackNavigator();

export default function App() {
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        // Carga la fuente del pack de íconos
        await MaterialCommunityIcons.loadFont();
      } catch (e) {
        console.warn("Icon font load error:", e);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  if (!ready) {
    // Fallback súper simple mientras carga la fuente
    return <View style={{ flex: 1, backgroundColor: "#121212" }} />;
  }

  return (
    <PaperProvider theme={theme}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" />
        <NavigationContainer theme={theme}>
          <Stack.Navigator initialRouteName="InicioSesion" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="InicioSesion" component={InicioSesion} />
            <Stack.Screen name="Bienvenida" component={Bienvenida} />
            <Stack.Screen name="Solicitud" component={Solicitud} />
            <Stack.Screen name="EditarPerfil" component={EditarPerfil} />
            <Stack.Screen name="Realizar" component={Realizar} />
            <Stack.Screen name="Lecturas" component={Lecturas} />
            <Stack.Screen name="Lectura" component={Lectura} />
            <Stack.Screen name="Correo" component={Correo} />
            <Stack.Screen name="ImpresoraBT" component={ImpresoraBT} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </PaperProvider>
  );
}
