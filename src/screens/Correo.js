import React, { useState, useEffect, use } from "react";
import { View } from "react-native";
import {
  Button,
  TextInput,
  Appbar,
  Text,
  useTheme,
  Card,
  Avatar,
  Portal,
  Dialog,
} from "react-native-paper";
import { patchCliente } from "../api";
import { useRoute } from "@react-navigation/native";

export default function Correo({ navigation }) {
  const { colors } = useTheme();
  const [correo, setcorreo] = useState("");
  const route = useRoute();
  const { clienteLugarCompletado } = route.params;
  const cliente = clienteLugarCompletado[0];
  const AvatarLetter = ({ letter }) => <Avatar.Text size={45} label={letter} />;
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [dialogIcon, setDialogIcon] = useState("");
  const [disabled, setDisabled] = useState(false);

  const handleCambio = async () => {
    if (!correo) {
      setTitle("Error");
      setContent("Debes ingresar un correo electrónico");
      setDialogIcon("alert-circle");
      setVisible(true);
      return;
    }
    try {
      const data = new FormData();
      data.append("correo", correo);
      await patchCliente(cliente.id, data);

      setTitle("Éxito");
      setContent("Correo electrónico guardado correctamente");
      setDialogIcon("check-circle");
      setVisible(true);

      setDisabled(true);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Portal>
        <Dialog visible={visible} onDismiss={() => setVisible(false)}>
          <Dialog.Icon icon={dialogIcon} color={colors.error} />
          <Dialog.Title>{title}</Dialog.Title>
          <Dialog.Content>
            <Text>{content}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setVisible(false)}>OK</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={"Agregar correo"} />
      </Appbar.Header>
      <View
        style={{
          marginBottom: 16,
          padding: 16,
          gap: 16,
        }}
      >
        <Card style={{ backgroundColor: colors.surface }} mode="outlined">
          <Card.Title
            title={cliente.nombre}
            subtitle={cliente.lote}
            left={() => <AvatarLetter letter={cliente.nombre[0]} />}
          />
          <Card.Content>
            <Text>Medidor: {cliente.medidor}</Text>
            <Text>Orden: {cliente.orden}</Text>
          </Card.Content>
        </Card>

        <TextInput
          mode="outlined"
          label="Correo electrónico"
          placeholder="Ingrese el correo electrónico"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          disabled={disabled}
          value={correo}
          onChangeText={(text) => setcorreo(text)}
          style={{ backgroundColor: colors.surface }}
        />

        <Button
          mode="contained"
          icon="pencil"
          disabled={disabled}
          contentStyle={{ height: 48 }}
          style={{
            width: "100%",
            alignSelf: "center",
          }}
          onPress={() => handleCambio()}
        >
          Guardar
        </Button>
      </View>
    </View>
  );
}
