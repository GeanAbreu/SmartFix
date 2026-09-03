export const DEVICE_CATALOG = {
  Smartphone: {
    Apple: ["iPhone 11", "iPhone 12", "iPhone 13", "iPhone 14", "iPhone 15", "iPhone 16", "Outro modelo"],
    Samsung: ["Galaxy A", "Galaxy M", "Galaxy S", "Galaxy Z Flip", "Galaxy Z Fold", "Outro modelo"],
    Motorola: ["Moto E", "Moto G", "Motorola Edge", "Razr", "Outro modelo"],
    Xiaomi: ["Redmi", "Redmi Note", "POCO", "Xiaomi", "Outro modelo"],
    Outra: ["Outro modelo"],
  },
  Notebook: {
    Acer: ["Aspire", "Nitro", "Predator", "Swift", "Outro modelo"],
    Apple: ["MacBook Air", "MacBook Pro", "Outro modelo"],
    Asus: ["ROG", "TUF", "Vivobook", "Zenbook", "Outro modelo"],
    Dell: ["G Series", "Inspiron", "Latitude", "XPS", "Outro modelo"],
    Lenovo: ["IdeaPad", "Legion", "ThinkPad", "Yoga", "Outro modelo"],
    Outra: ["Outro modelo"],
  },
  Tablet: {
    Apple: ["iPad", "iPad Air", "iPad mini", "iPad Pro", "Outro modelo"],
    Samsung: ["Galaxy Tab A", "Galaxy Tab S", "Outro modelo"],
    Lenovo: ["Lenovo Tab", "Yoga Tab", "Outro modelo"],
    Outra: ["Outro modelo"],
  },
  "Console de videogame": {
    Microsoft: ["Xbox One", "Xbox Series S", "Xbox Series X", "Outro modelo"],
    Nintendo: ["Nintendo Switch", "Nintendo Switch Lite", "Nintendo Switch OLED", "Outro modelo"],
    Sony: ["PlayStation 4", "PlayStation 5", "Outro modelo"],
    Outra: ["Outro modelo"],
  },
  Smartwatch: {
    Apple: ["Apple Watch", "Apple Watch SE", "Apple Watch Ultra", "Outro modelo"],
    Samsung: ["Galaxy Watch", "Galaxy Watch Classic", "Outro modelo"],
    Xiaomi: ["Redmi Watch", "Xiaomi Watch", "Outro modelo"],
    Outra: ["Outro modelo"],
  },
} as const;

export const DEVICE_TYPES = Object.keys(DEVICE_CATALOG);

export function getDeviceBrands(tipo: string) {
  const brands = DEVICE_CATALOG[tipo as keyof typeof DEVICE_CATALOG];
  return brands ? Object.keys(brands) : [];
}

export function getDeviceModels(tipo: string, marca: string) {
  const brands = DEVICE_CATALOG[tipo as keyof typeof DEVICE_CATALOG];
  if (!brands) return [];

  const models = (brands as Record<string, readonly string[]>)[marca];
  return models ? [...models] : [];
}
