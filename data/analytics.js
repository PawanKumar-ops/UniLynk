export const EVENT = {
  title: 'AlgoRush 2026',
  subtitle: 'Registration & Response Analytics',
  window: 'Aug 1 – Aug 14, 2026',
}

export const BRANCH_DATA = [
  { label: 'Computer Science', count: 148 },
  { label: 'Electronics', count: 96 },
  { label: 'Mechanical', count: 61 },
  { label: 'Information Tech', count: 84 },
  { label: 'Electrical', count: 44 },
  { label: 'Civil', count: 28 },
]

export const YEAR_DATA = [
  { label: 'First Year', count: 132 },
  { label: 'Second Year', count: 174 },
  { label: 'Third Year', count: 121 },
  { label: 'Fourth Year', count: 48 },
  { label: 'Fifth Year', count: 16 },
]

export const TOTAL_REGISTRANTS = BRANCH_DATA.reduce((s, b) => s + b.count, 0)

// Registrations (bars) vs responses (line) per day across the window
export const REGISTRATION_TREND = [
  { day: 'Aug 1', registrations: 18, responses: 12 },
  { day: 'Aug 3', registrations: 34, responses: 26 },
  { day: 'Aug 5', registrations: 52, responses: 41 },
  { day: 'Aug 7', registrations: 71, responses: 58 },
  { day: 'Aug 9', registrations: 96, responses: 84 },
  { day: 'Aug 11', registrations: 118, responses: 104 },
  { day: 'Aug 13', registrations: 78, responses: 70 },
  { day: 'Aug 14', registrations: 44, responses: 39 },
]

// Branch × Year heatmap matrix
export const MATRIX_YEARS = ['1st', '2nd', '3rd', '4th', '5th']
export const BRANCH_YEAR_MATRIX = [
  { branch: 'Computer Science', values: [44, 52, 38, 20, 6] },
  { branch: 'Electronics', values: [30, 34, 24, 11, 3] },
  { branch: 'Information Tech', values: [26, 31, 21, 9, 3] },
  { branch: 'Mechanical', values: [18, 22, 17, 6, 2] },
  { branch: 'Electrical', values: [10, 18, 13, 4, 1] },
  { branch: 'Civil', values: [8, 11, 7, 3, 1] },
]

export const QUESTIONS = [
  {
    id: 'q1',
    title: 'What do you hope to gain from AlgoRush?',
    type: 'paragraph',
    responses: 461,
    avgWords: 34,
    sampleResponses: [
      'I want to sharpen my dynamic programming skills under time pressure and finally break into the top bracket.',
      'Looking to meet teammates who take competitive programming seriously and learn how they approach graph problems.',
      'Mostly here for the internship shortlists — but the practice rounds are a huge bonus for placements.',
    ],
  },
  {
    id: 'q2',
    title: 'Which track are you registering for?',
    type: 'multiple-choice',
    options: [
      { label: 'Competitive Programming', count: 214 },
      { label: 'Web / App Hackathon', count: 138 },
      { label: 'ML & Data', count: 76 },
      { label: 'CTF / Security', count: 33 },
    ],
  },
  {
    id: 'q3',
    title: 'Which languages are you comfortable with?',
    type: 'multiple-correct',
    options: [
      { label: 'C++', count: 288 },
      { label: 'Python', count: 331 },
      { label: 'Java', count: 176 },
      { label: 'JavaScript', count: 209 },
      { label: 'Go', count: 54 },
      { label: 'Rust', count: 41 },
    ],
  },
  {
    id: 'q4',
    title: 'Preferred experience level',
    type: 'dropdown',
    options: [
      { label: 'Beginner', count: 118 },
      { label: 'Intermediate', count: 226 },
      { label: 'Advanced', count: 97 },
      { label: 'Expert', count: 40 },
    ],
  },
  {
    id: 'q5',
    title: 'Upload your resume (PDF)',
    type: 'file-upload',
    submitted: 397,
    missing: 64,
    fileKinds: [
      { label: 'PDF', count: 361 },
      { label: 'DOCX', count: 28 },
      { label: 'Image', count: 8 },
    ],
  },
]

const BRANCHES = ['Computer Science', 'Electronics', 'Mechanical', 'Information Tech', 'Electrical', 'Civil']
const YEARS = ['First Year', 'Second Year', 'Third Year', 'Fourth Year', 'Fifth Year']
const FIRST = ['Aarav', 'Diya', 'Vivaan', 'Ananya', 'Krishna', 'Ishaan', 'Saanvi', 'Reyansh', 'Myra', 'Arjun', 'Aadhya', 'Kabir', 'Anika', 'Vihaan', 'Pari', 'Rudra', 'Navya', 'Aryan', 'Kiara', 'Dev']
const LAST = ['Sharma', 'Verma', 'Iyer', 'Reddy', 'Nair', 'Gupta', 'Mehta', 'Rao', 'Singh', 'Bose', 'Joshi', 'Kapoor']

function makeRegistrants(n) {
  const out = []
  for (let i = 0; i < n; i++) {
    const first = FIRST[i % FIRST.length]
    const last = LAST[(i * 7) % LAST.length]
    const day = (i % 14) + 1
    out.push({
      id: `u${i + 1}`,
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${(i % 90) + 10}@nitkkr.ac.in`,
      branch: BRANCHES[(i * 3) % BRANCHES.length],
      year: YEARS[(i * 5) % YEARS.length],
      registeredAt: `Aug ${day < 10 ? '0' + day : day}, 2026`,
      avatarHue: (i * 47) % 360,
    })
  }
  return out
}

export const REGISTRANTS = makeRegistrants(40)

export const INITIAL_TEAMS = [
  {
    id: 't1',
    name: 'Segfault Syndicate',
    status: 'completed',
    capacity: 4,
    members: [
      { registrantId: 'u1', role: 'leader' },
      { registrantId: 'u2', role: 'member' },
      { registrantId: 'u3', role: 'member' },
      { registrantId: 'u4', role: 'member' },
    ],
  },
  {
    id: 't2',
    name: 'Null Pointers',
    status: 'completed',
    capacity: 4,
    members: [
      { registrantId: 'u5', role: 'leader' },
      { registrantId: 'u6', role: 'member' },
      { registrantId: 'u7', role: 'member' },
      { registrantId: 'u8', role: 'member' },
    ],
  },
  {
    id: 't3',
    name: 'Recursion Rebels',
    status: 'partial',
    capacity: 4,
    members: [
      { registrantId: 'u9', role: 'leader' },
      { registrantId: 'u10', role: 'member' },
    ],
  },
  {
    id: 't4',
    name: 'Big-O Brigade',
    status: 'partial',
    capacity: 4,
    members: [
      { registrantId: 'u11', role: 'leader' },
      { registrantId: 'u12', role: 'member' },
      { registrantId: 'u13', role: 'member' },
    ],
  },
  {
    id: 't5',
    name: 'Heap Overflow',
    status: 'partial',
    capacity: 4,
    members: [{ registrantId: 'u14', role: 'leader' }],
  },
]

// registrants not in any team = solo pool
export const SOLO_IDS = REGISTRANTS.map((r) => r.id).filter(
  (id) => !INITIAL_TEAMS.some((t) => t.members.some((m) => m.registrantId === id)),
)
