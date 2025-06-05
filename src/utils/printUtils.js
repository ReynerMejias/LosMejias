import { printAsync } from "expo-print";

export const imprimirDocumento = async (
  cliente,
  lugar,
  numeroComprobante,
  clienteUltimaLecturaValor,
  clienteUltimaLecturaAnteriorValor,
  getFecha,
  getFechaVencimiento,
  completada
) => {
  const html = `
      <html>
        <head>
          <style>
            body { font-family: monospace; text-align: center; font-size: 12px; }
            h1 { font-size: 16px; margin: 5px 0; }
            .datos { text-align: left; margin: 10px 0; }
            .resaltado { font-weight: bold; }
            hr { border: 0; border-top: 1px dashed black; margin: 10px 0; }
          </style>
        </head>
        <body>
          <h1>Gasto de Agua</h1>
          <p>${numeroComprobante}</p>
          <hr>
          <div class="datos">
            <p><span class="resaltado">Cliente:</span> ${cliente.nombre}</p>
            <p><span class="resaltado">Lote:</span> ${cliente.lote}</p>
            <p><span class="resaltado">Medidor:</span> ${cliente.medidor}</p>
          </div>
          <hr>
          <p><span class="resaltado">Fecha lectura:</span> ${getFecha(
            cliente,
            completada,
            lugar
          )}</p>
          <p><span class="resaltado">Fecha vencimiento:</span> ${getFechaVencimiento(
            cliente,
            completada,
            lugar
          )}</p>
          <p><span class="resaltado">Lectura anterior:</span> ${clienteUltimaLecturaAnteriorValor}</p>
          <p><span class="resaltado">Lectura actual:</span> ${clienteUltimaLecturaValor}</p>
          <hr>
          <p><span class="resaltado">Costo por metro:</span> CRC ${
            lugar.valor
          }</p>
          <p><span class="resaltado">Metros:</span> ${
            clienteUltimaLecturaValor > clienteUltimaLecturaAnteriorValor
              ? clienteUltimaLecturaValor - clienteUltimaLecturaAnteriorValor
              : 0
          }</p>
          <p><span class="resaltado">Total a pagar:</span> CRC ${
            clienteUltimaLecturaValor > clienteUltimaLecturaAnteriorValor
              ? (clienteUltimaLecturaValor -
                  clienteUltimaLecturaAnteriorValor) *
                lugar.valor
              : 0
          }</p>
          <hr>
          <p>Recuerde ir a la oficina a cancelar su factura.</p>
        </body>
      </html>
    `;
  try {
    await printAsync({ html });
  } catch (error) {
    console.error("Error al imprimir:", error);
  }
};
