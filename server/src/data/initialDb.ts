export const initialDbState = {
  products: [
    {
      id: "ducati-v4r",
      type: "moto",
      name: "Ducati Panigale V4 R",
      price: 44995,
      image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&auto=format&fit=crop&q=80",
      description: "La máxima expresión del ADN de carreras de Ducati. Una motocicleta de circuito homologada para la calle que ofrece prestaciones sin precedentes en su categoría.",
      category: "Superbike",
      stock: 3,
      features: [
        "Motor Desmosedici Stradale V4 de 998 cc",
        "Potencia máxima de 221 HP @ 15,250 RPM",
        "Suspensión electrónica ajustable Öhlins NPX 25/30",
        "Estructura del chasis \"Front Frame\" de magnesio",
        "Llantas de carbono de 5 radios"
      ]
    },
    {
      id: "yamaha-r1m",
      type: "moto",
      name: "Yamaha YZF-R1M",
      price: 26999,
      image: "https://images.unsplash.com/photo-1624446587260-030982dc829c?w=600&auto=format&fit=crop&q=80",
      description: "Inspirada directamente en la YZR-M1 de MotoGP, la R1M ofrece una experiencia de circuito definitiva gracias a su avanzada tecnología de control de tracción y aerodinámica de vanguardia.",
      category: "Superbike",
      stock: 4,
      features: [
        "Motor crossplane de 4 cilindros y 998 cc con bielas de titanio",
        "Suspensión electrónica Öhlins Racing de competición (ERS)",
        "Carrocería completa de fibra de carbono ultraligera",
        "Unidad de control de comunicaciones (CCU) con registro GPS",
        "Neumáticos Bridgestone Battlax RS11"
      ]
    },
    {
      id: "harley-sport-s",
      type: "moto",
      name: "Harley-Davidson Sportster S",
      price: 16399,
      image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80",
      description: "El inicio de un nuevo capítulo en la saga Sportster. Una bestia diseñada para ofrecer un empuje asombroso combinado con una agilidad y maniobrabilidad de primer nivel.",
      category: "Cruiser",
      stock: 6,
      features: [
        "Motor Revolution Max 1250T refrigerado por líquido",
        "121 Caballos de fuerza de torque inmediato",
        "Escape de alta salida con tono profundo de carreras",
        "Modos de conducción personalizables (Sport, Road, Rain)",
        "Instrumentación digital redonda en pantalla TFT de 4\""
      ]
    },
    {
      id: "honda-crf450r",
      type: "moto",
      name: "Honda CRF450R",
      price: 9699,
      image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&auto=format&fit=crop&q=80",
      description: "La reina absoluta del Motocross y Supercross. Rediseñada con chasis de aluminio liviano y mapeos adaptables para conquistar cualquier podio.",
      category: "Motocross",
      stock: 8,
      features: [
        "Motor monocilíndrico Unicam de 449.7 cc",
        "Embrague hidráulico de alta resistencia de 8 discos",
        "Horquilla de resorte Showa de 49 mm ajustable",
        "Sistema de control de torque seleccionable (HSTC)",
        "Manubrio Renthal Fatbar de serie"
      ]
    },
    {
      id: "escape-akrapovic",
      type: "pieza",
      name: "Escape de Titanio Akrapovič Slip-On",
      price: 1850,
      image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&auto=format&fit=crop&q=80",
      description: "Sistema de escape slip-on fabricado enteramente en aleación de titanio de grado aeroespacial, rematado con una copa de salida artesanal en fibra de carbono.",
      category: "Sistemas de Escape",
      stock: 12,
      features: [
        "Incremento de potencia verificado de +8.5 HP",
        "Reducción de peso masiva de 3.6 kg frente al escape de fábrica",
        "Tono deportivo profundo y resonante único de Akrapovič",
        "No requiere reprogramación de ECU para funcionamiento base",
        "Compatible con Kawasaki ZX-10R (2021-2026)"
      ]
    },
    {
      id: "frenos-brembo-gp4",
      type: "pieza",
      name: "Cálipers Brembo GP4-RX Billet",
      price: 1499,
      image: "https://images.unsplash.com/photo-1515777315835-281b94c9589f?w=600&auto=format&fit=crop&q=80",
      description: "Cálipers radiales mecanizados por CNC a partir de un solo bloque de aluminio con acabado niquelado de alta resistencia. Diseñados para máxima consistencia de frenado.",
      category: "Sistemas de Freno",
      stock: 8,
      features: [
        "Cuatro pistones de aluminio autocentrantes de 32 mm",
        "Mecanizados mediante CNC a partir de bloques macizos (Billet)",
        "Acabado de niquelado brillante para disipar el calor",
        "Canales de aire integrados para ventilación de pastillas",
        "Presión uniforme en el rotor y cero flexión bajo esfuerzo"
      ]
    },
    {
      id: "suspension-ohlins-ttx",
      type: "pieza",
      name: "Amortiguador Trasero Öhlins TTX Flow",
      price: 1150,
      image: "https://images.unsplash.com/photo-1616422285623-13ff0162193c?w=600&auto=format&fit=crop&q=80",
      description: "La tecnología TTX patentada de doble tubo combinada con amortiguación dinámica inteligente proporciona un control inigualable sobre saltos, baches e imperfecciones.",
      category: "Suspensiones",
      stock: 5,
      features: [
        "Tecnología de doble tubo TTX de flujo positivo",
        "Ajuste independiente de rebote y compresión a alta/baja velocidad",
        "Válvula limitadora de presión dinámica para evitar rebotes bruscos",
        "Cuerpo de aluminio anodizado duro ultra resistente",
        "Precarga de resorte ajustable de forma remota e hidráulica"
      ]
    },
    {
      id: "neumatico-michelin",
      type: "pieza",
      name: "Kit Neumáticos Michelin Power GP2",
      price: 399,
      image: "https://images.unsplash.com/photo-1558981420-87aa9dad1c89?w=600&auto=format&fit=crop&q=80",
      description: "Juego de neumáticos (Delantero y Trasero) diseñados para rodar en carretera deportiva y sacarle el máximo partido a tus jornadas de Track Day.",
      category: "Llantas",
      stock: 20,
      features: [
        "Compuesto de goma dual de carreras de Michelin (2CT+)",
        "Hombros lisos tipo slick para una adherencia óptima en curvas extremas",
        "Máxima de velocidad autorizada por encima de 270 km/h",
        "Zona central rayada para disipación de agua excelente",
        "Medidas estándar: Front 120/70 ZR17 | Rear 190/55 ZR17"
      ]
    }
  ],
  orders: [
    {
      id: "PED-8293",
      userEmail: "invitado@gmail.com",
      userName: "Juan Pérez",
      items: [
        {
          id: "item-1",
          productId: "escape-akrapovic",
          name: "Escape de Titanio Akrapovič Slip-On",
          price: 1850,
          quantity: 1,
          image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&auto=format&fit=crop&q=80"
        }
      ],
      total: 1850,
      paymentMethod: "credit_card",
      status: "pagado",
      createdAt: "2026-06-08T14:30:00.000Z",
      shippingAddress: "Av. Diagonal #422, apto 4B, CDMX, México",
      phone: "+52 55 1234 5678"
    },
    {
      id: "PED-9104",
      userEmail: "annierfq01@gmail.com",
      userName: "Annier FQ",
      items: [
        {
          id: "item-2",
          productId: "neumatico-michelin",
          name: "Kit Neumáticos Michelin Power GP2",
          price: 399,
          quantity: 2,
          image: "https://images.unsplash.com/photo-1558981420-87aa9dad1c89?w=600&auto=format&fit=crop&q=80"
        }
      ],
      total: 798,
      paymentMethod: "bank_transfer",
      status: "pendiente",
      createdAt: "2026-06-09T09:15:00.000Z",
      shippingAddress: "Calle Principal #12, Santiago, Chile",
      phone: "+56 9 8765 4321"
    },
    {
      id: "PED-2384",
      userEmail: "cliente-demo@redline.com",
      userName: "Sofía Medina",
      items: [
        {
          id: "item-3",
          productId: "frenos-brembo-gp4",
          name: "Cálipers Brembo GP4-RX Billet",
          price: 1499,
          quantity: 1,
          image: "https://images.unsplash.com/photo-1515777315835-281b94c9589f?w=600&auto=format&fit=crop&q=80"
        }
      ],
      total: 1499,
      paymentMethod: "credit_card",
      status: "enviado",
      createdAt: "2026-06-05T18:45:00.000Z",
      shippingAddress: "Carrera 7 #72-30, Bogotá, Colombia",
      phone: "+57 321 987 6543"
    }
  ],
  users: [
    {
      id: "admin-user",
      email: "annierfq01@gmail.com",
      name: "Annier FQ",
      role: "admin",
      createdAt: "2026-05-10T12:00:00.000Z",
      active: true
    },
    {
      id: "demo-client-1",
      email: "invitado@gmail.com",
      name: "Juan Pérez",
      role: "cliente",
      createdAt: "2026-06-02T15:20:00.000Z",
      active: true
    },
    {
      id: "demo-client-2",
      email: "cliente-demo@redline.com",
      name: "Sofía Medina",
      role: "cliente",
      createdAt: "2026-06-03T11:40:00.000Z",
      active: true
    }
  ],
  settings: {
    paymentsEnabled: false,
    contactPhone: "+53 5212 3456",
    contactEmail: "cuba@treckmotors.com",
    shopAddress: "Calle General García #102, e/ Lora y Masó, Bayamo, Granma, Cuba",
    shopHours: "Lunes a Viernes: 8:30 AM - 5:30 PM | Sábados: 9:00 AM - 1:00 PM",
    reservationsEnabled: true,
    facebookUrl: "https://facebook.com/treckmotorscuba",
    instagramUrl: "https://instagram.com/treckmotorscuba",
    whatsappNumber: "+5352123456",
    paymentMethods: [
      {
        id: "credit_card",
        name: "Pago con Tarjeta MLC / Internacional",
        enabled: false,
        description: "Opción inactiva por defecto. Las compras y pagos oficiales de repuestos y motos se completan físicamente."
      },
      {
        id: "bank_transfer",
        name: "Transferencia Bancaria Nacional (CUP/MLC)",
        enabled: true,
        description: "Paga tu reserva coordinando una transferencia a nuestras cuentas del Banco Metropolitano de Cuba.",
        details: "Banco Metropolitano (Cuba), Cuenta CUP: #0562-4412-9844-3200, Cuenta MLC: #0562-4412-9844-5500. Correo para confirmación: cuba@treckmotors.com"
      },
      {
        id: "cash",
        name: "Pago Presencial en Efectivo (CUP/EUR/USD)",
        enabled: true,
        description: "Realiza tu compra directamente en efectivo en nuestra oficina principal en Bayamo."
      }
    ]
  }
};
