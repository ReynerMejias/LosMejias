// src/utils/zplPrinter.js — versión segura (sin llamadas en import)
import { Platform, PermissionsAndroid } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_BT_ADDR = "zpl:bt:addr";
const KEY_PW_DOTS = "zpl:pw:dots";
const isClassicMac = (s) => /^[0-9A-F]{2}(:[0-9A-F]{2}){5}$/i.test(String(s || ""));

// Lazy require para evitar “runtime not ready”
function getBT() {
  // eslint-disable-next-line global-require
  const mod = require("react-native-bluetooth-classic").default;
  if (!mod) throw new Error("react-native-bluetooth-classic no está linkeado.");
  return mod;
}

export async function ensureBtReady() {
  if (Platform.OS !== "android") return true;
  const perms = [
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
  ];
  const res = await PermissionsAndroid.requestMultiple(perms);
  const ok = perms.every((p) => res[p] === PermissionsAndroid.RESULTS.GRANTED);
  if (!ok) throw new Error("Permisos Bluetooth denegados.");
  const RNBluetoothClassic = getBT();
  const enabled = await RNBluetoothClassic.isBluetoothEnabled();
  if (!enabled) { try { await RNBluetoothClassic.requestEnable(); } catch {} }
  return true;
}

// ancho ZPL
export async function getWidthDots() {
  const raw = await AsyncStorage.getItem(KEY_PW_DOTS);
  return raw ? Number(raw) : 576;
}
export async function setWidthDots(n) {
  const v = Math.max(200, Math.floor(Number(n) || 0));
  await AsyncStorage.setItem(KEY_PW_DOTS, String(v));
  return v;
}

// listado emparejados (SPP)
export async function scanDevices() {
  await ensureBtReady();
  const RNBluetoothClassic = getBT();
  const list = await RNBluetoothClassic.getBondedDevices();
  return { paired: Array.isArray(list) ? list : [], found: [] };
}

// conectar (sin .disconnect() de instancias)
export async function connectBT(address) {
  await ensureBtReady();
  if (!isClassicMac(address)) throw new Error("Usa MAC clásica AA:BB:CC:DD:EE:FF.");
  const RNBluetoothClassic = getBT();
  const connected = await RNBluetoothClassic.isDeviceConnected(address);
  if (!connected) {
    await RNBluetoothClassic.connectToDevice(address, { CONNECTOR_TYPE: "rfcomm" });
  }
  await AsyncStorage.setItem(KEY_BT_ADDR, address);
  return address;
}

export async function getSavedBT() {
  const a = await AsyncStorage.getItem(KEY_BT_ADDR);
  return a && isClassicMac(a) ? a : null;
}
export async function saveBT(address) {
  if (isClassicMac(address)) await AsyncStorage.setItem(KEY_BT_ADDR, address);
}

function toAscii(str) {
  return String(str ?? "");
}


export async function sendZPL(zpl, address) {
  const mac = address || (await getSavedBT());
  if (!mac) throw new Error("Sin impresora seleccionada.");
  const RNBluetoothClassic = getBT();

  const isConn = await RNBluetoothClassic.isDeviceConnected(mac);
  if (!isConn) {
    await RNBluetoothClassic.connectToDevice(mac, { CONNECTOR_TYPE: "rfcomm" });
    await new Promise(r => setTimeout(r, 120));
  }

  const ascii = toAscii(zpl);
  // Primero: tal cual; si falla, probamos CRLF
  const variants = [ascii, ascii.endsWith("\n") ? ascii : ascii + "\r\n"];

  let lastErr;
  for (const payload of variants) {
    try {
      await RNBluetoothClassic.writeToDevice(mac, payload);
      return;
    } catch (e) {
      lastErr = e;
      await new Promise(r => setTimeout(r, 80));
    }
  }
  throw lastErr || new Error("No se pudo escribir ZPL.");
}




// ===== Generadores ZPL =====

// normaliza PW: si viene 0/NaN, usamos 576
const normPW = (pw) => {
  const n = Number(pw);
  return n && n > 0 ? n : 576;
};

// header con modo CONTINUOUS (^MNN) + TEAR-OFF (^MMT) + offset de tear
const header = (pw, ll, { tearOffset = 0 } = {}) =>
  `^XA^PON^PW${normPW(pw)}^MNN^MMT^TO${Math.floor(tearOffset)}^LH0,0^CI28^LL${Math.max(60, Math.floor(ll))}\n`;

const footer = () => "^XZ";

// ========== HELLO (alto compacto) ==========
export function makeZplHello({ pw = 576, tearOffset = 0 } = {}) {
  // layout simple: calcula y incremental
  let y = 30;
  const line = (txt, size = 40, x = 30) => {
    const s = `^FO${x},${y}^A0N,${size},${size}^FD${txt}^FS\n`;
    y += size + 10;
    return s;
  };

  let body = "";
  body += line("HELLO ZPL", 50);
  body += line("1234567890", 40);

  const ll = y + 20; // alto exacto
  return header(pw, ll, { tearOffset }) + body + footer();
}

// ========== BARRA NEGRA A ANCHO COMPLETO ==========
export function makeZplFullBlackBar({ pw = 576, height = 48, tearOffset = 0 } = {}) {
  const W = normPW(pw);
  const H = Math.max(8, Math.floor(height));
  const ll = H + 40;
  return header(W, ll, { tearOffset }) + `^FO0,0^GB${W},${H},${H},B,0^FS\n` + footer();
}

// ========== TICKET DINÁMICO (alto según contenido) ==========
export function makeZplTicket({
  pw = 576,
  tearOffset = 0,           // pon -40 o -60 si deja papel de más
  title = "Comprobante de lectura",
  comp = "Comprobante #20250925-123-ABC",
  cliente = "Juan Perez",
  lote = "A1",
  medidor = "123456",
  sector = "CRI",
  fecha = "2003-02-15",
  vence = "2003-03-15",
  lectAnt = "100",
  lectAct = "118",
  consumo = "18",
  tarifa = "CRC 500",
  subtotal = "CRC 9,000",
  total = "CRC 9,000",
  multa = "CRC 0",
  obs = "",
  despedida = "Gracias por su pago.",
} = {}) {
  const W = normPW(pw);
  let y = 20;

  const line = (txt, size = 34, x = 20) => {
    const s = `^FO${x},${y}^A0N,${size},${size}^FD${txt}^FS\n`;
    y += size + 10;
    return s;
  };
  const sep = () => {
    const s = `^FO20,${y}^GB${W - 40},2,2^FS\n`;
    y += 16;
    return s;
  };

  let b = "";
  b += line(title, 40);
  b += line(comp, 28);
  y += 2;
  b += sep();

  b += line(`Cliente: ${cliente}`, 30);
  b += line(`Lote: ${lote}   Medidor: ${medidor}`, 30);
  b += line(`Sector: ${sector}`, 30);
  b += line(`Fecha: ${fecha}   Vence: ${vence}`, 28);
  b += sep();

  b += line(`Lect. ant.: ${lectAnt}`, 30);
  b += line(`Lect. act.: ${lectAct}`, 30);
  b += line(`Consumo (m³): ${consumo}`, 30);
  b += sep();

  b += line(`Tarifa x m3: ${tarifa}`, 30);
  b += line(`Subtotal: ${subtotal}`, 30);
  b += line(`Multa:    ${multa}`, 30);
  if (obs && String(obs).trim()) {
    b += line(`Motivo: ${obs}`, 28);
  }
  b += sep();

  b += line(`Total: ${total}`, 44);
  b += `^FO0,${y}^GB${W},36,36,B,0^FS\n`;
  y += 50;

  b += line(despedida, 32, 80);
  y += 20;

  const ll = y + 20; // alto exacto según contenido
  return header(W, ll, { tearOffset }) + b + footer();
}


// accesos directos (firmas compatibles con tu pantalla)

export async function printHelloZPL({ address, tearOffset = -50 } = {}) {
  const pw = await getWidthDots();
  await sendZPL(makeZplHello({ pw, tearOffset }), address);
}

export async function printBlackBarFullWidthZPL({ height = 48, address, tearOffset = 0 } = {}) {
  const pw = await getWidthDots();
  await sendZPL(makeZplFullBlackBar({ pw, height, tearOffset }), address);
}

// OJO: aquí mantengo la firma (fields = {}, address)
export async function printTicketZPL(fields = {}, address) {
  const pw = await getWidthDots();
  const { tearOffset = -60, ...rest } = fields || {};
  await sendZPL(makeZplTicket({ pw, tearOffset, ...rest }), address);
}

// imprime una etiqueta mínima (si esto no sale, no está en ZPL)
export async function printZplSimple(address) {
  const z = "^XA^FO40,40^A0N,40,40^FDTEST ZPL^FS^XZ";
  await sendZPL(z, address);
}

// imprime la etiqueta de configuración (si sale: 100% ZPL activo)
export async function printZplConfig(address) {
  const z = "^XA^HH^XZ";
  await sendZPL(z, address);
}

// imprime con ancho chico por si ^PW grande lesiona al motor
export async function printZplSafeWidth(address) {
  const z = "^XA^PW384^LL300^FO20,20^A0N,40,40^FDSAFE WIDTH^FS^XZ";
  await sendZPL(z, address);
}
