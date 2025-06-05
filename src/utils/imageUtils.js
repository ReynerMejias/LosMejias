import * as ImagePicker from "expo-image-picker";

export const takePhoto = async () => {
  // Solicitar permiso para usar la cámara
  const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
  if (permissionResult.granted === false) {
    alert("Es necesario conceder permisos para usar la cámara");
    return;
  }

  // Tomar una foto
  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [3, 4],
    quality: 1,
  });

  if (!result.canceled) {
    return result.assets[0].uri;
  }
  return null;
};
