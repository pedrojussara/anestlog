export const SPECIALTIES = [
  'Ortopedia',
  'Cirurgia Geral',
  'Cirurgia Cardíaca',
  'Cirurgia Torácica',
  'Neurocirurgia',
  'Cirurgia Vascular',
  'Urologia',
  'Ginecologia/Obstetrícia',
  'Cirurgia Pediátrica',
  'Cirurgia Plástica',
  'Otorrinolaringologia',
  'Oftalmologia',
  'Colonoscopia/Endoscopia',
  'Cirurgia Oncológica',
  'Cirurgia Bucomaxilofacial',
  'Transplantes',
] as const

export const PROCEDURE_TYPES = [
  { value: 'nenhum',                 label: 'Nenhum',                   group: 'Geral' },
  { value: 'intubacao_orotraqueal',  label: 'Intubação Orotraqueal',    group: 'Via Aérea' },
  { value: 'intubacao_nasotraqueal', label: 'Intubação Nasotraqueal',   group: 'Via Aérea' },
  { value: 'mascara_laringea',       label: 'Máscara Laríngea',         group: 'Via Aérea' },
  { value: 'raquidiana',             label: 'Raquianestesia',            group: 'Neuroeixo' },
  { value: 'peridural',              label: 'Peridural',                 group: 'Neuroeixo' },
  { value: 'acesso_venoso_central',  label: 'Acesso Venoso Central',    group: 'Acessos' },
  { value: 'acesso_venoso_periferico', label: 'Acesso Venoso Periférico', group: 'Acessos' },
  { value: 'acesso_arterial',        label: 'Acesso Arterial',          group: 'Acessos' },
  { value: 'bloqueio_periferico',    label: 'Bloqueio Periférico',      group: 'Bloqueios' },
  { value: 'outro',                  label: 'Outro',                    group: 'Outros' },
] as const

export type ProcedureTypeValue = typeof PROCEDURE_TYPES[number]['value']

export const INTUBATION_TYPES: ProcedureTypeValue[] = [
  'intubacao_orotraqueal',
  'intubacao_nasotraqueal',
]

export const NERVE_BLOCK_GROUPS = [
  {
    region: 'Membro Superior',
    items: [
      'Bloqueio do Plexo Cervical Superficial',
      'Bloqueio Interescalênico',
      'Bloqueio Supraclavicular',
      'Bloqueio Infraclavicular',
      'Bloqueio Axilar',
      'Bloqueio do Antebraço',
      'Bloqueio do Punho',
    ],
  },
  {
    region: 'Membro Inferior',
    items: [
      'Bloqueio Femoral',
      'Bloqueio da Fáscia Ilíaca',
      'Bloqueio do Obturador',
      'Bloqueio do Safeno',
      'Bloqueio do Canal Adutor',
      'Bloqueio Ciático Transglúteo',
      'Bloqueio Ciático Subglúteo',
      'Bloqueio Ciático Poplíteo',
      'Bloqueio do Tornozelo',
      'Bloqueio PENG',
      'Bloqueio do Plexo Lombar',
    ],
  },
  {
    region: 'Tórax e Parede Abdominal',
    items: [
      'TAP Block',
      'ESP Block (Eretor da Espinha)',
      'QL Block (Quadrado Lombar)',
      'PECS I',
      'PECS II',
      'Bloqueio Serrátil',
      'Bloqueio do Reto Abdominal',
      'Bloqueio Paravertebral',
      'Bloqueio Paraesternal',
    ],
  },
  {
    region: 'Cabeça e Pescoço',
    items: [
      'Bloqueio do Nervo Occipital Maior',
      'Bloqueio do Plexo Cervical Profundo',
    ],
  },
  {
    region: 'Outros',
    items: ['Outros'],
  },
] as const

// Lista flat derivada dos grupos — usada em GoalsClient e analytics
export const NERVE_BLOCK_TYPES: readonly string[] =
  NERVE_BLOCK_GROUPS.flatMap((g) => g.items)
