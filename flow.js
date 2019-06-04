module.exports = [
  {
    title: 'Incumplimiento de entrega de producto comprado a distancia',
    description: `¿Qué información necesito para evaluar la contingencia del reclamo?
      \n- Número de orden de compra o datos que permitan identificar la transacción materia de reclamo(*).
      \n- Estado de la orden de compra.
      \n- Carta de extorno del procesador de pagos o solicitud de extorno al Banco Falabella.
      \n- Guía de remisión.`,
    questions: [
      'A. ¿El cliente fue informado que la orden de compra se encuentra en proceso de validación y tenemos los sustentos?',
      'B. ¿El cliente fue informado que la orden de compra fue rechazada por una causal establecida en los Términos y Condiciones de la web y tenemos los sustentos?',
      'C. ¿La carta de extorno del procesador de pagos o la solicitud de extorno al BF fue gestionada? ',
      'D. ¿La carta de extorno del procesador de pagos o la solicitud de extorno al BF fue gestionada por el valor total de la orden de compra?',
      'E. ¿La carta de extorno del procesador de pagos o la solicitud de extorno al BF fue gestionada dentro de un plazo de 30 días calendarios?',
      'F. ¿El cliente fue informado que la orden de compra superó con éxito el proceso de validación y el producto se encuentra listo para su recojo o despacho? ',
      'G. ¿El producto se encontró disponible para el recojo en tienda  o fue enviado a la dirección indicada en la fecha programada?',
      'H. ¿El comprobante de entrega del producto en tienda o la guía de remisión se ha extraviado?',
      'I. En el caso de recojo en tienda:    ¿El comprobante de entrega consigna el código y descripción del producto según requerimiento del cliente, así como su firma y DNI? Asimismo, cuando el cliente autorice a un tercero para el recojo ¿tenemos la constancia de la autorización? ¿el comprobante de entrega consigna la firma, DNI y nombre del tercero autorizado?                                             En caso de despacho a domicilio:     ¿La guía de remisión consigna dirección de envío y descripción del producto según requerimiento del cliente, la firma, DNI y nombre de la persona que recibió el producto, así como la relación de parentesco o afinidad de este con el cliente?',
    ],
    possibilities: [
      {
        result: 'Contingente',
        solution: `Orden de compra no sujeta a evaluación: según requerimiento del cliente, cuando haya stock, entregar producto solicitado u otro producto de idénticas o superiores características sin cobros adicionales; o, gestionar el monto reservado o devolver en efectivo el monto cobrado.                          Orden de compra rechazada: gestionar el extorno del monto reservado o devolver en efectivo el monto cobrado                          Orden de compra validada: entregar un producto sustituto con idénticas o superiores características sin cobros adicionales y, en caso se haya gestionado unilateralmente el extorno, en forma gratuita.`,
        paths: [
          // A     B     C     D     E     F     G     H     I
          [true, true, true, true, false, null, null, null, null],
          [true, true, true, false, null, null, null, null, null],
          [true, true, false, null, null, null, null, null, null],
          [true, false, null, null, null, true, true, true, null],
          [true, false, null, null, null, true, true, false, false],
          [true, false, null, null, null, true, false, null, null],
          [true, false, null, null, null, false, null, null, null],
          [false, null, null, null, null, null, null, null, null],
        ],
      },
      {
        result: 'No contingente',
        solution: `Orden de compra no sujeta a evaluación: según requerimiento del cliente, cuando haya stock, entregar producto solicitado u otro producto de idénticas o superiores características sin cobros adicionales; o, gestionar el monto reservado o devolver en efectivo el monto cobrado.                          Orden de compra rechazada: gestionar el extorno del monto reservado o devolver en efectivo el monto cobrado                          Orden de compra validada: entregar un producto sustituto con idénticas o superiores características sin cobros adicionales y, en caso se haya gestionado unilateralmente el extorno, en forma gratuita.`,
        paths: [
          // A     B     C     D     E     F     G     H     I
          [true, true, true, true, true, null, null, null, null],
          [true, false, null, null, null, true, true, false, true],
        ],
      }
    ],
  },















  {
    title: 'Operaciones no reconocidas',
    description: `¿Qué información necesito para evaluar la contingencia del reclamo?
      \n- Voucher de la operación.
      \n- Ficha del Reniec.`,
    questions: [
      'A. ¿El voucher de la operación de la operación se ha extraviado?',
      'B. ¿Hay igualdad entre el número del DNI consignado en la Ficha Reniec y en el voucher de la operación?',
      'C. ¿Hay similitud entre la firma consignada en la Ficha Reniec y en el voucher de la operación?',
      'D. ¿El voucher de la operación contiene solo un (1) número de DNI y una (1) firma?',
    ],
    possibilities: [
      {
        result: 'Contingente',
        solution: `Gestionar el extorno de la operación.`,
        paths: [
          // A     B     C     D     E     F     G     H     I
          [true, null, null, null],
          [false, true, false, null],
          [false, true, true, false],
          [false, false, null, null],
        ],
      },
      {
        result: 'No contingente',
        solution: `Gestionar el extorno de la operación.`,
        paths: [
          // A     B     C     D     E     F     G     H     I
          [false, true, true, true],
        ],
      }
    ],
  },











  {
    title: 'Incumplimiento de extorno',
    description: `¿Qué información necesito para evaluar la contingencia del reclamo?
      \n- Fecha y monto de la transacción objeto de extorno.
      \n- Carta de extorno del procesador de pagos o constancia de solicitud de extorno al Banco Falabella.`,
    questions: [
      'A. ¿La solicitud de extorno se realizó?',
      'B. ¿La solicitud de extorno se realizó por el monto total de la transacción?',
      'C. ¿La solicitud de extorno se realizó dentro del plazo informado en la nota de crédito o, en su defecto, en 30 días calendario?',
    ],
    possibilities: [
      {
        result: 'Contingente',
        solution: `Gestionar el extorno.`,
        paths: [
          // A     B     C     D     E     F     G     H     I
          [true, true, false],
          [true, false, null],
          [false, null, null],
        ],
      },
      {
        result: 'No contingente',
        solution: `Gestionar el extorno.`,
        paths: [
          // A     B     C     D     E     F     G     H     I
          [true, true, true],
        ],
      }
    ],
  },


];
