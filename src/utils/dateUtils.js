export const getFecha = (cliente, completada, lugar) => {
  if (cliente.ultima_lectura && cliente.ultima_lectura.fecha_lectura) {
    const fecha = new Date(cliente.ultima_lectura.fecha_lectura + "T00:00:00");
    const dia = fecha.getDate();

    if (!completada) {
      fecha.setMonth(fecha.getMonth() + 1);
    }

    if (fecha.getDate() !== dia) {
      fecha.setDate(0); // Ajusta al último día del mes
    }

    return fecha.toLocaleDateString();
  } else {
    const today = new Date();
    const dia = lugar.dia || today.getDate();
    const mes = today.getMonth(); // Mes actual
    const ano = today.getFullYear(); // Año actual
    const fecha = new Date(ano, mes, dia);
    return fecha.toLocaleDateString();
  }
};

export const getFechaVencimiento = (cliente, completada, lugar) => {
  if (cliente.ultima_lectura && cliente.ultima_lectura.fecha_lectura) {
    const fecha = new Date(cliente.ultima_lectura.fecha_lectura + "T00:00:00");
    const dia = fecha.getDate();

    if (!completada) {
      fecha.setMonth(fecha.getMonth() + 2);
    } else {
      fecha.setMonth(fecha.getMonth() + 1);
    }

    if (fecha.getDate() !== dia) {
      fecha.setDate(0); // Ajusta al último día del mes
    }

    return fecha.toLocaleDateString();
  } else {
    const today = new Date();
    const dia = lugar.dia || today.getDate();
    const mes = today.getMonth() + 1; // Mes siguiente
    const ano = today.getFullYear();
    const fecha = new Date(ano, mes, dia);

    if (fecha.getDate() !== dia) {
      fecha.setDate(0); // Ajusta al último día del mes
    }

    return fecha.toLocaleDateString();
  }
};
