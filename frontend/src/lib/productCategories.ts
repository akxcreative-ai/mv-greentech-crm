export interface ProductSubCategory {
  id: string;
  name: string;
  description?: string;
  searchKeywords: string[];
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  subcategories: ProductSubCategory[];
}

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  {
    id: 'sensor',
    name: 'Sensor',
    description: 'Industrial automation and precision sensing devices',
    subcategories: [
      { id: 'capacitive-sensor', name: 'Capacitive Sensor', searchKeywords: ['capacitive', 'capacitance', 'liquid level capacitive'] },
      { id: 'current-voltage-transmitters', name: 'Current And Voltage Transmitters and Transformers', searchKeywords: ['current transmitter', 'voltage transmitter', 'transformer', 'ct', 'pt'] },
      { id: 'hall-effect-sensors', name: 'Hall effect Current &Voltage Sensors', searchKeywords: ['hall effect', 'hall current', 'hall voltage'] },
      { id: 'inductive-sensors', name: 'Inductive Sensors', searchKeywords: ['inductive', 'proximity sensor', 'metal detector'] },
      { id: 'industrial-safety', name: 'Industrial safety', searchKeywords: ['safety', 'light curtain', 'safety barrier', 'interlock'] },
      { id: 'laser-ranging-sensors', name: 'Laser ranging sensors', searchKeywords: ['laser', 'ranging', 'lidar', 'distance measurement'] },
      { id: 'speed-sensors', name: 'Speed sensors', searchKeywords: ['speed sensor', 'rpm', 'tachometer', 'wheel speed'] },
      { id: 'travel-switch', name: 'Travel switch', searchKeywords: ['travel switch', 'limit switch', 'microswitch', 'position switch'] },
      { id: 'ultrasonic-sensors', name: 'Ultrasonic sensors', searchKeywords: ['ultrasonic', 'ultrasonic sensor', 'sound wave', 'sonar'] },
      { id: 'platinum-rtds', name: 'Wire wound & Thin film Platinum RTDs', searchKeywords: ['rtd', 'pt100', 'pt1000', 'platinum', 'temperature sensor'] },
      { id: 'textile-sensors', name: 'Textile sensors', searchKeywords: ['textile sensor', 'yarn sensor', 'thread detector'] },
      { id: 'smart-guardrail-system', name: 'Smart Guardrail system', searchKeywords: ['guardrail', 'smart guardrail', 'collision sensor'] },
      { id: 'belt-conveyer', name: 'Belt conveyer', searchKeywords: ['belt conveyer', 'conveyor', 'pull cord', 'belt sway'] },
      { id: 'magnetic-switch', name: 'Magnetic Switch', searchKeywords: ['magnetic switch', 'reed switch', 'magnetic float', 'float sensor'] },
      { id: 'wireless-sensors', name: 'Wireless sensors', searchKeywords: ['wireless sensor', 'lora', 'zigbee', 'iot sensor'] },
      { id: 'instruments', name: 'Instruments', searchKeywords: ['instruments', 'digital indicator', 'controller', 'display'] },
      { id: 'vibration-sensors', name: 'Vibration sensors', searchKeywords: ['vibration', 'accelerometer', 'seismic sensor', 'bearing monitor'] },
    ],
  },
  {
    id: 'iot-solutions',
    name: 'IOT solutions',
    description: 'Smart connected industrial IoT ecosystems and telemetry',
    subcategories: [
      { id: 'smart-water-management', name: 'Smart Water Management', searchKeywords: ['smart water', 'water management', 'water automation'] },
      { id: 'industrial-iot-gateways', name: 'Industrial IoT Gateways', searchKeywords: ['gateway', 'iot gateway', 'edge controller', 'modbus gateway'] },
      { id: 'wireless-sensor-nodes', name: 'Wireless Sensor Nodes', searchKeywords: ['sensor node', 'wireless node', 'telemetry node'] },
      { id: 'telemetry-remote-monitoring', name: 'Telemetry & Remote Monitoring', searchKeywords: ['telemetry', 'remote monitoring', 'cloud telemetry'] },
      { id: 'tank-level-monitoring', name: 'Tank Level Monitoring System', searchKeywords: ['tank level', 'water level indicator', 'tank monitoring'] },
      { id: 'cloud-scada-analytics', name: 'Cloud Scada & Analytics', searchKeywords: ['scada', 'cloud scada', 'analytics', 'dashboard'] },
    ],
  },
  {
    id: 'water-meter',
    name: 'Water Meter',
    description: 'High-precision mechanical and digital water metering',
    subcategories: [
      { id: 'single-jet-watermeter', name: 'Single Jet Watermeter', searchKeywords: ['single jet', 'mechanical watermeter'] },
      { id: 'multi-jet-watermeter', name: 'Multi Jet Watermeter', searchKeywords: ['multi jet', 'mechanical watermeter'] },
      { id: 'ultrasonic-water-meter', name: 'Ultrasonic water meter', searchKeywords: ['ultrasonic water meter', 'ultrasonic meter'] },
      { id: 'amr-ami-water-meter', name: 'AMR/AMI water meter', searchKeywords: ['amr', 'ami', 'smart water meter', 'wireless water meter'] },
      { id: 'electromagnetic-flow-meter', name: 'Electromagnetic Flow Meter', searchKeywords: ['electromagnetic', 'magflow', 'flow meter'] },
    ],
  },
];
