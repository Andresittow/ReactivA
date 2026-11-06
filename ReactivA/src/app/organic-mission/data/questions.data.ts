// ============================================================
// BANCO DE PREGUNTAS – Misión Orgánica: Domina el Carbono
// 4 niveles × mecánicas variadas × retroalimentación pedagógica
// ============================================================

import { LevelConfig, Question } from '../models/game.models';

// ─── NIVEL 1: Detectives del Carbono ────────────────────────
const nivel1Questions: Question[] = [
  {
    id: 'n1-q01',
    levelId: 1,
    activity: 'multiple-choice',
    difficulty: 'basica',
    question: '¿Cuál de los siguientes compuestos es ORGÁNICO?',
    options: ['NaCl (Sal de mesa)', 'CH₄ (Metano)', 'H₂O (Agua)', 'CO₂ (Dióxido de carbono)'],
    correctIndex: 1,
    explanation: 'El metano (CH₄) es un compuesto orgánico porque contiene carbono enlazado a hidrógeno. Los compuestos orgánicos se caracterizan principalmente por tener carbono como elemento central, formando cadenas o anillos.'
  },
  {
    id: 'n1-q02',
    levelId: 1,
    activity: 'multiple-choice',
    difficulty: 'basica',
    question: '¿Qué elemento es la base de todos los compuestos orgánicos?',
    options: ['Hidrógeno (H)', 'Oxígeno (O)', 'Carbono (C)', 'Nitrógeno (N)'],
    correctIndex: 2,
    explanation: 'El carbono (C) es el elemento fundamental de la química orgánica. Su capacidad única de formar 4 enlaces covalentes le permite crear largas cadenas, anillos y estructuras tridimensionales complejas.'
  },
  {
    id: 'n1-q03',
    levelId: 1,
    activity: 'multiple-choice',
    difficulty: 'basica',
    question: '¿Cuántos enlaces covalentes puede formar un átomo de carbono?',
    options: ['2', '3', '4', '6'],
    correctIndex: 2,
    explanation: 'El carbono tiene 4 electrones en su capa de valencia, por eso puede formar exactamente 4 enlaces covalentes. Esta tetravalencia le permite unirse a sí mismo y a otros átomos en infinitas combinaciones.'
  },
  {
    id: 'n1-q04',
    levelId: 1,
    activity: 'multiple-choice',
    difficulty: 'basica',
    question: '¿Cuál de estos es un compuesto INORGÁNICO?',
    options: ['Glucosa (C₆H₁₂O₆)', 'Etanol (C₂H₅OH)', 'Agua (H₂O)', 'Benceno (C₆H₆)'],
    correctIndex: 2,
    explanation: 'El agua (H₂O) es inorgánica porque no contiene carbono en su estructura. Aunque es esencial para la vida, no cumple los criterios de un compuesto orgánico: presencia de carbono con enlace C-H.'
  },
  {
    id: 'n1-q05',
    levelId: 1,
    activity: 'identify-molecule',
    difficulty: 'basica',
    question: '¿A qué tipo de cadena carbonada pertenece esta estructura?\n\nC — C — C — C (cadena lineal de 4 carbonos)',
    formula: 'C–C–C–C',
    options: ['Cadena ramificada', 'Cadena cerrada (cíclica)', 'Cadena abierta lineal', 'Cadena aromática'],
    correctIndex: 2,
    explanation: 'Una cadena abierta lineal (también llamada acíclica o alifática) es aquella en la que los carbonos se unen uno tras otro en línea recta, sin formar anillos. El butano (C₄H₁₀) es el ejemplo clásico.'
  },
  {
    id: 'n1-q06',
    levelId: 1,
    activity: 'multiple-choice',
    difficulty: 'intermedia',
    question: '¿Qué propiedad especial del carbono le permite formar millones de compuestos distintos?',
    options: [
      'Su color negro característico',
      'Su capacidad de catenación (unirse consigo mismo)',
      'Su alto punto de fusión',
      'Su solubilidad en agua'
    ],
    correctIndex: 1,
    explanation: 'La catenación es la capacidad del carbono de formar enlaces C-C estables, creando cadenas largas o anillos. Ningún otro elemento lo hace en tal magnitud. Esto explica por qué existen más de 10 millones de compuestos orgánicos conocidos.'
  },
  {
    id: 'n1-q07',
    levelId: 1,
    activity: 'multiple-choice',
    difficulty: 'intermedia',
    question: '¿Cuál de las siguientes fórmulas representa una cadena carbonada CÍCLICA?',
    options: ['CH₄', 'C₂H₆', 'C₃H₈', 'C₆H₁₂ (ciclohexano)'],
    correctIndex: 3,
    explanation: 'El ciclohexano (C₆H₁₂) tiene sus carbonos unidos en forma de anillo cerrado. Las cadenas cíclicas se caracterizan porque el último carbono se enlaza de nuevo con el primero, formando una estructura circular.'
  },
  {
    id: 'n1-q08',
    levelId: 1,
    activity: 'match-pairs',
    difficulty: 'intermedia',
    question: 'Relaciona cada compuesto con su clasificación (orgánico o inorgánico):',
    pairs: [
      { formula: 'CH₄ (Metano)', name: 'Orgánico' },
      { formula: 'NaCl (Sal)', name: 'Inorgánico' },
      { formula: 'C₂H₅OH (Etanol)', name: 'Orgánico' },
      { formula: 'H₂SO₄ (Ácido sulfúrico)', name: 'Inorgánico' }
    ],
    explanation: 'Los compuestos orgánicos contienen carbono enlazado a hidrógeno (C-H). El metano y el etanol son orgánicos. La sal (NaCl) y el ácido sulfúrico (H₂SO₄) son inorgánicos porque no tienen carbono enlazado a hidrógeno.'
  },
  {
    id: 'n1-q09',
    levelId: 1,
    activity: 'multiple-choice',
    difficulty: 'avanzada',
    question: 'Una molécula con la fórmula general CₙH₂ₙ₊₂ y solo enlaces simples entre carbonos pertenece a:',
    options: ['Los alquenos', 'Los alquinos', 'Los alcanos', 'Los compuestos aromáticos'],
    correctIndex: 2,
    explanation: 'La fórmula general CₙH₂ₙ₊₂ corresponde a los alcanos. Son hidrocarburos saturados con solo enlaces simples (C-C). Por ejemplo: metano CH₄ (n=1), etano C₂H₆ (n=2), propano C₃H₈ (n=3).'
  },
  {
    id: 'n1-q10',
    levelId: 1,
    activity: 'time-attack',
    difficulty: 'avanzada',
    question: '⏱ RETO CONTRARRELOJ: ¿Cuántos carbonos tiene el propano?',
    options: ['1', '2', '3', '4'],
    correctIndex: 2,
    timeLimit: 10,
    explanation: 'El propano (C₃H₈) tiene 3 átomos de carbono. El prefijo "prop-" en nomenclatura IUPAC siempre indica 3 carbonos en la cadena principal.'
  }
];

// ─── NIVEL 2: Cazadores de Hidrocarburos ────────────────────
const nivel2Questions: Question[] = [
  {
    id: 'n2-q01',
    levelId: 2,
    activity: 'multiple-choice',
    difficulty: 'basica',
    question: '¿Qué son los hidrocarburos?',
    options: [
      'Compuestos formados solo por hidrógeno y oxígeno',
      'Compuestos orgánicos formados exclusivamente por carbono e hidrógeno',
      'Cualquier molécula que contiene carbono',
      'Compuestos con nitrógeno e hidrógeno'
    ],
    correctIndex: 1,
    explanation: 'Los hidrocarburos son compuestos orgánicos formados ÚNICAMENTE por carbono (C) e hidrógeno (H). Son la familia más simple de los compuestos orgánicos y se clasifican en alcanos, alquenos, alquinos y aromáticos.'
  },
  {
    id: 'n2-q02',
    levelId: 2,
    activity: 'multiple-choice',
    difficulty: 'basica',
    question: '¿Cuál es la característica principal de los ALCANOS?',
    options: [
      'Tienen solo enlaces dobles C=C',
      'Tienen solo enlaces triples C≡C',
      'Tienen solo enlaces simples C–C (saturados)',
      'Tienen un anillo bencénico'
    ],
    correctIndex: 2,
    explanation: 'Los alcanos son hidrocarburos SATURADOS porque todos sus enlaces entre carbonos son simples (C–C). No tienen enlaces dobles ni triples. Su fórmula general es CₙH₂ₙ₊₂. Ejemplos: metano, etano, propano, butano.'
  },
  {
    id: 'n2-q03',
    levelId: 2,
    activity: 'identify-molecule',
    difficulty: 'basica',
    question: 'La molécula con fórmula C₂H₄ y un enlace doble C=C pertenece a la familia de los:',
    formula: 'CH₂=CH₂',
    options: ['Alcanos', 'Alquenos', 'Alquinos', 'Aromáticos'],
    correctIndex: 1,
    explanation: 'El eteno (C₂H₄), con la estructura CH₂=CH₂, es un alqueno. Los alquenos tienen al menos un enlace doble C=C entre sus carbonos y su fórmula general es CₙH₂ₙ. El eteno es el alqueno más simple y se usa para madurar frutas artificialmente.'
  },
  {
    id: 'n2-q04',
    levelId: 2,
    activity: 'multiple-choice',
    difficulty: 'basica',
    question: '¿Qué tipo de enlace caracteriza a los ALQUINOS?',
    options: [
      'Enlace simple C–C',
      'Enlace doble C=C',
      'Enlace triple C≡C',
      'Enlace iónico C⁺–C⁻'
    ],
    correctIndex: 2,
    explanation: 'Los alquinos tienen al menos un enlace triple C≡C entre sus carbonos. Su fórmula general es CₙH₂ₙ₋₂. El alquino más simple es el etino (C₂H₂), también llamado acetileno, que se usa en sopletes de soldadura.'
  },
  {
    id: 'n2-q05',
    levelId: 2,
    activity: 'match-pairs',
    difficulty: 'intermedia',
    question: 'Relaciona cada hidrocarburo con su familia:',
    pairs: [
      { formula: 'CH₄ (Metano)', name: 'Alcano' },
      { formula: 'C₂H₄ (Eteno)', name: 'Alqueno' },
      { formula: 'C₂H₂ (Etino)', name: 'Alquino' },
      { formula: 'C₆H₆ (Benceno)', name: 'Aromático' }
    ],
    explanation: 'Metano = alcano (solo enlaces simples). Eteno = alqueno (doble enlace C=C). Etino/acetileno = alquino (triple enlace C≡C). Benceno = aromático (anillo con 6 carbonos y sistema de electrones π deslocalizado).'
  },
  {
    id: 'n2-q06',
    levelId: 2,
    activity: 'multiple-choice',
    difficulty: 'intermedia',
    question: '¿Cuál es la fórmula molecular del benceno, el hidrocarburo aromático más simple?',
    options: ['C₄H₄', 'C₅H₅', 'C₆H₆', 'C₆H₁₂'],
    correctIndex: 2,
    explanation: 'El benceno (C₆H₆) es el hidrocarburo aromático más simple. Tiene 6 carbonos en anillo con 3 enlaces dobles alternados (sistema conjugado). August Kekulé propuso su estructura en 1865. Es base de muchos plásticos y medicamentos.'
  },
  {
    id: 'n2-q07',
    levelId: 2,
    activity: 'identify-molecule',
    difficulty: 'intermedia',
    question: 'Esta estructura tiene 6 carbonos en anillo con electrones π deslocalizados. ¿A qué familia pertenece?',
    formula: 'C₆H₆ ⬡',
    options: ['Alcano cíclico', 'Alqueno', 'Alquino', 'Hidrocarburo aromático'],
    correctIndex: 3,
    explanation: 'El anillo hexagonal con electrones π deslocalizados es la firma de los hidrocarburos aromáticos. El benceno (C₆H₆) es el más famoso. La "aromaticidad" no se refiere al olor, sino a su estabilidad química especial.'
  },
  {
    id: 'n2-q08',
    levelId: 2,
    activity: 'multiple-choice',
    difficulty: 'avanzada',
    question: 'Ordena correctamente de mayor a menor grado de insaturación: alcanos, alquinos, alquenos.',
    options: [
      'Alcanos > Alquenos > Alquinos',
      'Alquinos > Alquenos > Alcanos',
      'Alquenos > Alquinos > Alcanos',
      'Todos tienen el mismo grado de insaturación'
    ],
    correctIndex: 1,
    explanation: 'Los alquinos tienen el mayor grado de insaturación (triple enlace = 2 insaturaciones), seguidos por los alquenos (doble enlace = 1 insaturación). Los alcanos son saturados (0 insaturaciones). Mayor insaturación = menos hidrógenos en la fórmula.'
  },
  {
    id: 'n2-q09',
    levelId: 2,
    activity: 'multiple-choice',
    difficulty: 'avanzada',
    question: '¿Cuál es la fórmula general de los alquenos?',
    options: ['CₙH₂ₙ₊₂', 'CₙH₂ₙ', 'CₙH₂ₙ₋₂', 'CₙHₙ'],
    correctIndex: 1,
    explanation: 'Los alquenos tienen la fórmula general CₙH₂ₙ. El doble enlace "consume" dos hidrógenos respecto al alcano equivalente. Ejemplo: eteno C₂H₄ (n=2: 2×2=4 hidrógenos), propeno C₃H₆ (n=3: 2×3=6 hidrógenos).'
  },
  {
    id: 'n2-q10',
    levelId: 2,
    activity: 'time-attack',
    difficulty: 'reto-final',
    question: '⏱ RETO CONTRARRELOJ: El acetileno (usado en sopletes) tiene la fórmula C₂H₂. ¿A qué familia pertenece?',
    options: ['Alcano', 'Alqueno', 'Alquino', 'Aromático'],
    correctIndex: 2,
    timeLimit: 12,
    explanation: 'El acetileno (etino, C₂H₂) es un alquino: tiene un triple enlace C≡C entre sus dos carbonos. Su alta energía de combustión lo hace ideal para los sopletes de soldadura, donde alcanza temperaturas de hasta 3500°C.'
  }
];

// ─── NIVEL 3: El Desafío IUPAC ────────────────────────────
const nivel3Questions: Question[] = [
  {
    id: 'n3-q01',
    levelId: 3,
    activity: 'multiple-choice',
    difficulty: 'basica',
    question: '¿Qué significa IUPAC?',
    options: [
      'Institución Universal de Programas Académicos de Ciencias',
      'Unión Internacional de Química Pura y Aplicada',
      'Instituto Universitario de Preparación Avanzada en Ciencias',
      'Unión Internacional de Procesos Atómicos y Corporativos'
    ],
    correctIndex: 1,
    explanation: 'IUPAC significa "International Union of Pure and Applied Chemistry" (Unión Internacional de Química Pura y Aplicada). Es el organismo internacional que establece las reglas de nomenclatura química usadas en todo el mundo.'
  },
  {
    id: 'n3-q02',
    levelId: 3,
    activity: 'multiple-choice',
    difficulty: 'basica',
    question: '¿Qué prefijo IUPAC indica que la cadena principal tiene 3 carbonos?',
    options: ['Met-', 'Et-', 'Prop-', 'But-'],
    correctIndex: 2,
    explanation: 'El prefijo "prop-" indica 3 carbonos en la cadena principal. Tabla de prefijos: Met=1C, Et=2C, Prop=3C, But=4C, Pent=5C, Hex=6C, Hept=7C, Oct=8C. Estos prefijos vienen del griego/latín para los números correspondientes.'
  },
  {
    id: 'n3-q03',
    levelId: 3,
    activity: 'nomenclature',
    difficulty: 'basica',
    question: 'La fórmula CH₃–CH₂–CH₃ corresponde a un alcano de 3 carbonos. ¿Cuál es su nombre IUPAC?',
    formula: 'CH₃–CH₂–CH₃',
    options: ['Metano', 'Etano', 'Propano', 'Butano'],
    correctIndex: 2,
    explanation: 'CH₃–CH₂–CH₃ tiene 3 carbonos en cadena lineal con solo enlaces simples. Prefijo para 3C = "prop-" + sufijo para alcano = "-ano". Resultado: PROPANO. Es el gas usado en las estufas de camping.'
  },
  {
    id: 'n3-q04',
    levelId: 3,
    activity: 'match-pairs',
    difficulty: 'basica',
    question: 'Relaciona el número de carbonos con el prefijo IUPAC correcto:',
    pairs: [
      { formula: '1 carbono', name: 'Met-' },
      { formula: '4 carbonos', name: 'But-' },
      { formula: '5 carbonos', name: 'Pent-' },
      { formula: '6 carbonos', name: 'Hex-' }
    ],
    explanation: 'Los prefijos IUPAC son: 1=Met, 2=Et, 3=Prop, 4=But, 5=Pent, 6=Hex, 7=Hept, 8=Oct, 9=Non, 10=Dec. Aprenderlos es fundamental para nombrar cualquier compuesto orgánico.'
  },
  {
    id: 'n3-q05',
    levelId: 3,
    activity: 'nomenclature',
    difficulty: 'intermedia',
    question: 'La fórmula CH₂=CH–CH₃ es un alqueno de 3 carbonos. ¿Cuál es su nombre IUPAC?',
    formula: 'CH₂=CH–CH₃',
    options: ['Propano', 'Propeno', 'Propino', 'Buteno'],
    correctIndex: 1,
    explanation: 'CH₂=CH–CH₃ tiene 3 carbonos (prop-) y un doble enlace C=C (-eno). Por tanto su nombre es PROPENO. Las reglas IUPAC para alquenos usan el sufijo "-eno" en lugar de "-ano" de los alcanos.'
  },
  {
    id: 'n3-q06',
    levelId: 3,
    activity: 'nomenclature',
    difficulty: 'intermedia',
    question: '¿Cómo se llama el compuesto CH≡C–CH₂–CH₃ (alquino de 4 carbonos)?',
    formula: 'CH≡C–CH₂–CH₃',
    options: ['Butano', 'Buteno', 'Butino', 'Propino'],
    correctIndex: 2,
    explanation: 'CH≡C–CH₂–CH₃ tiene 4 carbonos (but-) y un triple enlace C≡C (-ino). Nombre: BUT-1-INO. El "1" indica que el triple enlace está entre los carbonos 1 y 2. Los alquinos usan el sufijo "-ino".'
  },
  {
    id: 'n3-q07',
    levelId: 3,
    activity: 'multiple-choice',
    difficulty: 'intermedia',
    question: 'En nomenclatura IUPAC, el sufijo "-ano" indica que el compuesto es:',
    options: [
      'Un alqueno con doble enlace',
      'Un alquino con triple enlace',
      'Un alcano con solo enlaces simples',
      'Un compuesto aromático'
    ],
    correctIndex: 2,
    explanation: 'El sufijo "-ano" indica que es un alcano, es decir, un hidrocarburo saturado con solo enlaces simples C–C. Los sufijos en IUPAC: -ano (alcanos), -eno (alquenos), -ino (alquinos). El sufijo identifica el tipo de enlace entre carbonos.'
  },
  {
    id: 'n3-q08',
    levelId: 3,
    activity: 'nomenclature',
    difficulty: 'avanzada',
    question: '¿Cuál es el nombre IUPAC del compuesto CH₃–CH₂–CH₂–CH₂–CH₃ (5 carbonos, solo enlaces simples)?',
    formula: 'CH₃–CH₂–CH₂–CH₂–CH₃',
    options: ['Butano', 'Pentano', 'Hexano', 'Propano'],
    correctIndex: 1,
    explanation: 'CH₃–CH₂–CH₂–CH₂–CH₃ tiene 5 carbonos en cadena lineal con solo enlaces simples. Prefijo para 5C = "pent-" + sufijo alcano = "-ano" = PENTANO. Es un componente del gas natural y se usa como disolvente.'
  },
  {
    id: 'n3-q09',
    levelId: 3,
    activity: 'multiple-choice',
    difficulty: 'avanzada',
    question: 'En un compuesto ramificado como el 2-metilpropano, ¿qué indica el número "2"?',
    options: [
      'Que hay 2 átomos de carbono en total',
      'Que el grupo metilo está en el carbono 2 de la cadena principal',
      'Que hay 2 grupos metilo',
      'Que el compuesto tiene 2 dobles enlaces'
    ],
    correctIndex: 1,
    explanation: 'En nomenclatura IUPAC, el número indica la POSICIÓN de la ramificación en la cadena principal. "2-metilpropano" significa: cadena principal de propano (3C), con un grupo metilo (–CH₃) en el carbono número 2.'
  },
  {
    id: 'n3-q10',
    levelId: 3,
    activity: 'time-attack',
    difficulty: 'reto-final',
    question: '⏱ RETO: El hexano tiene 6 carbonos. ¿Cuál es su fórmula molecular correcta (solo enlaces simples)?',
    options: ['C₆H₆', 'C₆H₁₂', 'C₆H₁₄', 'C₆H₁₀'],
    correctIndex: 2,
    timeLimit: 15,
    explanation: 'El hexano es un alcano con 6 carbonos. Usando la fórmula CₙH₂ₙ₊₂: n=6 → H = 2(6)+2 = 14. Por tanto: C₆H₁₄. Es un disolvente común y componente de la gasolina.'
  }
];

// ─── NIVEL 4: Maestro del Carbono ────────────────────────
const nivel4Questions: Question[] = [
  {
    id: 'n4-q01',
    levelId: 4,
    activity: 'multiple-choice',
    difficulty: 'avanzada',
    question: 'La diferencia entre etano (C₂H₆) y eteno (C₂H₄) es que el eteno tiene:',
    options: [
      'Un carbono más',
      'Un enlace doble C=C entre sus carbonos',
      'Un enlace triple C≡C',
      'Un anillo aromático'
    ],
    correctIndex: 1,
    explanation: 'Etano (C₂H₆) tiene un enlace simple C–C (alcano). Eteno (C₂H₄) tiene un enlace doble C=C (alqueno). La presencia del doble enlace hace que el eteno tenga 2 hidrógenos menos que el etano, y lo convierte en un compuesto insaturado reactivo.'
  },
  {
    id: 'n4-q02',
    levelId: 4,
    activity: 'match-pairs',
    difficulty: 'avanzada',
    question: 'Relaciona cada fórmula con su nombre IUPAC correcto:',
    pairs: [
      { formula: 'CH₄', name: 'Metano' },
      { formula: 'C₃H₆ (alqueno)', name: 'Propeno' },
      { formula: 'C₄H₁₀', name: 'Butano' },
      { formula: 'C₅H₈ (alquino)', name: 'Pentino' }
    ],
    explanation: 'Metano: 1C alcano. Propeno: 3C alqueno (doble enlace). Butano: 4C alcano. Pentino: 5C alquino (triple enlace). Recordar: -ano=alcano, -eno=alqueno, -ino=alquino.'
  },
  {
    id: 'n4-q03',
    levelId: 4,
    activity: 'nomenclature',
    difficulty: 'avanzada',
    question: '¿Cuál es el nombre IUPAC del compuesto con fórmula C₄H₈ y un doble enlace al inicio de la cadena?',
    formula: 'CH₂=CH–CH₂–CH₃',
    options: ['But-1-eno', 'But-2-eno', 'Butano', 'Propeno'],
    correctIndex: 0,
    explanation: 'CH₂=CH–CH₂–CH₃: 4 carbonos (but-), doble enlace C=C (-eno), la posición del doble enlace es entre C1 y C2 (1-eno). Nombre completo: BUT-1-ENO. En IUPAC se numera desde el extremo más cercano al doble enlace para dar el menor número posible.'
  },
  {
    id: 'n4-q04',
    levelId: 4,
    activity: 'identify-molecule',
    difficulty: 'avanzada',
    question: 'Esta molécula tiene 6 carbonos, 3 dobles enlaces alternados en anillo y propiedades de estabilidad especial. ¿Qué es?',
    formula: 'C₆H₆ ⬡ (anillo bencénico)',
    options: ['Ciclohexano (alcano cíclico)', 'Ciclohexeno (alqueno cíclico)', 'Benceno (aromático)', 'Hexino (alquino)'],
    correctIndex: 2,
    explanation: 'El benceno (C₆H₆) tiene 6 carbonos en anillo con electrones π deslocalizados, lo que le confiere una estabilidad especial llamada "aromaticidad". No reacciona fácilmente como los alquenos normales. Es la base de los compuestos aromáticos.'
  },
  {
    id: 'n4-q05',
    levelId: 4,
    activity: 'multiple-choice',
    difficulty: 'reto-final',
    question: '¿Por qué los alcanos se denominan "hidrocarburos saturados"?',
    options: [
      'Porque se disuelven fácilmente en agua',
      'Porque tienen el máximo número de átomos de hidrógeno posible para su número de carbonos',
      'Porque su punto de ebullición es muy alto',
      'Porque reaccionan rápidamente con el oxígeno'
    ],
    correctIndex: 1,
    explanation: '"Saturado" significa que los carbonos tienen el MÁXIMO de hidrógenos posible. Con solo enlaces simples C–C, cada carbono tiene tantos H como puede. No hay forma de agregar más hidrógenos sin romper la molécula. Por eso CₙH₂ₙ₊₂ es la fórmula máxima para n carbonos.'
  },
  {
    id: 'n4-q06',
    levelId: 4,
    activity: 'nomenclature',
    difficulty: 'reto-final',
    question: 'Nombra el siguiente alquino: HC≡C–CH₂–CH₂–CH₃ (5 carbonos, triple enlace al inicio)',
    formula: 'HC≡C–CH₂–CH₂–CH₃',
    options: ['Pent-1-ino', 'Pent-2-ino', 'Pentano', 'Pent-1-eno'],
    correctIndex: 0,
    explanation: 'HC≡C–CH₂–CH₂–CH₃: 5 carbonos (pent-), triple enlace (-ino), posición 1 (el triple enlace está entre C1 y C2). Nombre: PENT-1-INO. Para alquinos se usa el sufijo "-ino" y se indica la posición del triple enlace.'
  },
  {
    id: 'n4-q07',
    levelId: 4,
    activity: 'multiple-choice',
    difficulty: 'reto-final',
    question: 'Un compuesto orgánico con la fórmula C₅H₁₂ y solo enlaces simples es:',
    options: ['Un alqueno', 'Un alquino', 'Un alcano', 'Un aromático'],
    correctIndex: 2,
    explanation: 'C₅H₁₂ cumple la fórmula de alcano CₙH₂ₙ₊₂: n=5 → 2(5)+2=12. Con solo enlaces simples es definitivamente un alcano. Su nombre IUPAC es PENTANO. Los alcanos tienen la fórmula CₙH₂ₙ₊₂ siempre.'
  },
  {
    id: 'n4-q08',
    levelId: 4,
    activity: 'match-pairs',
    difficulty: 'reto-final',
    question: 'DESAFÍO FINAL: Relaciona la fórmula general con la familia de hidrocarburos:',
    pairs: [
      { formula: 'CₙH₂ₙ₊₂', name: 'Alcanos' },
      { formula: 'CₙH₂ₙ', name: 'Alquenos' },
      { formula: 'CₙH₂ₙ₋₂', name: 'Alquinos' },
      { formula: 'C₆H₅– (base)', name: 'Aromáticos' }
    ],
    explanation: 'Las fórmulas generales son clave: Alcanos CₙH₂ₙ₊₂ (saturados), Alquenos CₙH₂ₙ (1 doble enlace), Alquinos CₙH₂ₙ₋₂ (1 triple enlace), Aromáticos basados en el anillo bencénico C₆H₅–. ¡Las has aprendido todas!'
  },
  {
    id: 'n4-q09',
    levelId: 4,
    activity: 'identify-molecule',
    difficulty: 'reto-final',
    question: 'Tres carbonos, dos hidrógenos, fórmula C₃H₄, un triple enlace. ¿Qué es?',
    formula: 'CH≡C–CH₃',
    options: ['Propano', 'Propeno', 'Prop-1-ino', 'Metano'],
    correctIndex: 2,
    explanation: 'CH≡C–CH₃ tiene 3 carbonos (prop-), triple enlace entre C1 y C2 (-1-ino). Nombre: PROP-1-INO (también llamado propino o metilacetileno). Verifica: CₙH₂ₙ₋₂ → n=3: 2(3)-2=4. ✓ C₃H₄.'
  },
  {
    id: 'n4-q10',
    levelId: 4,
    activity: 'time-attack',
    difficulty: 'reto-final',
    question: '⏱ RETO MAESTRO: El tolueno es un aromático derivado del benceno con un grupo metilo. Su fórmula es:',
    options: ['C₆H₆', 'C₇H₈', 'C₆H₅CH₂', 'C₈H₁₀'],
    correctIndex: 1,
    timeLimit: 15,
    explanation: 'El tolueno (metilbenceno) tiene fórmula C₇H₈ = benceno C₆H₆ + un grupo metilo CH₂ (se pierde un H del anillo). Es un disolvente común en pinturas. ¡Felicidades, eres un verdadero Maestro del Carbono!'
  }
];

// ─── CONFIGURACIÓN DE NIVELES ────────────────────────────
export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    title: 'Detectives del Carbono',
    subtitle: 'Nivel 1',
    description: 'Aprende a identificar compuestos orgánicos, cadenas carbonadas y la magia del carbono.',
    difficulty: 'basica',
    icon: '🔍',
    color: '#10b981',
    reward: 50,
    minScore: 0,
    questions: nivel1Questions
  },
  {
    id: 2,
    title: 'Cazadores de Hidrocarburos',
    subtitle: 'Nivel 2',
    description: 'Domina los alcanos, alquenos, alquinos y compuestos aromáticos.',
    difficulty: 'intermedia',
    icon: '⚗️',
    color: '#3b82f6',
    reward: 50,
    minScore: 50,
    questions: nivel2Questions
  },
  {
    id: 3,
    title: 'El Desafío IUPAC',
    subtitle: 'Nivel 3',
    description: 'Aprende las reglas de nomenclatura sistemática y nombra compuestos como un experto.',
    difficulty: 'avanzada',
    icon: '📖',
    color: '#8b5cf6',
    reward: 50,
    minScore: 100,
    questions: nivel3Questions
  },
  {
    id: 4,
    title: 'Maestro del Carbono',
    subtitle: 'Nivel 4',
    description: 'El desafío definitivo. Combina todo lo aprendido para convertirte en experto.',
    difficulty: 'reto-final',
    icon: '🏆',
    color: '#f59e0b',
    reward: 50,
    minScore: 180,
    questions: nivel4Questions
  }
];

export const POINTS_BY_DIFFICULTY: Record<string, number> = {
  'basica': 10,
  'intermedia': 20,
  'avanzada': 30,
  'reto-final': 50
};

