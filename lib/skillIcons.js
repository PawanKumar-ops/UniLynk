export const skillIconMap = {
  /* ================= LANGUAGES ================= */
  javascript: "logos:javascript",
  js: "logos:javascript",
  typescript: "logos:typescript-icon",
  ts:"logos:typescript-icon",
  python: "logos:python",
  java: "logos:java",
  c: "logos:c",
  cpp: "logos:c-plusplus",
  cplusplus: "logos:c-plusplus",
  csharp: "logos:c-sharp",
  go: "logos:go",
  rust: "logos:rust",
  php: "logos:php",
  ruby: "logos:ruby",
  kotlin: "logos:kotlin",
  swift: "logos:swift",
  dart: "logos:dart",
  scala: "logos:scala",
  r: "logos:r-lang",
  matlab: "logos:mathworks",
  bash: "logos:bash-icon",
  powershell: "devicon-plain:powershell",

  /* ================= FRONTEND ================= */
  html: "logos:html-5",
  css: "logos:css-3",
  sass: "logos:sass",
  less: "logos:less",
  react: "logos:react",
  reactjs: "logos:react",
  nextjs: "logos:nextjs-icon",
  vue: "logos:vue",
  angular: "logos:angular-icon",
  svelte: "logos:svelte-icon",
  jquery: "logos:jquery",
  tailwindcss: "logos:tailwindcss-icon",
  bootstrap: "logos:bootstrap",
  materialui: "logos:material-ui",
  chakraui: "logos:chakra-ui",
  antDesign: "logos:ant-design",
  redux: "logos:redux",
  zustand: "logos:react",
  framerMotion: "logos:framer",

  /* ================= BACKEND ================= */
  nodejs: "logos:nodejs-icon",
  express: "logos:express",
  nestjs: "logos:nestjs",
  fastify: "logos:fastify-icon",
  django: "logos:django-icon",
  flask: "logos:flask",
  mongoose: "devicon:mongoose",
  fastapi: "logos:fastapi-icon",
  spring: "logos:spring-icon",
  springboot: "logos:spring-icon",
  laravel: "logos:laravel",
  codeigniter: "logos:codeigniter",
  rails: "logos:rails",
  graphql: "logos:graphql",
  apollo: "logos:apollo-icon",

  /* ================= DATABASES ================= */
  mongodb: "logos:mongodb-icon",
  mysql: "logos:mysql",
  postgresql: "logos:postgresql",
  sqlite: "logos:sqlite",
  redis: "logos:redis",
  cassandra: "logos:cassandra",
  dynamodb: "logos:aws-dynamodb",
  firebase: "logos:firebase-icon",
  supabase: "logos:supabase-icon",
  prisma: "logos:prisma",
  elasticsearch: "logos:elasticsearch",

  /* ================= DEVOPS / CLOUD ================= */
  docker: "devicon:docker",
  kubernetes: "logos:kubernetes",
  aws: "logos:aws",
  azure: "logos:microsoft-azure",
  gcp: "logos:google-cloud",
  vercel: "logos:vercel-icon",
  netlify: "logos:netlify",
  nginx: "logos:nginx",
  apache: "logos:apache",
  terraform: "logos:terraform",
  ansible: "logos:ansible",
  linux: "logos:linux-tux",
  ubuntu: "logos:ubuntu",
  debian: "logos:debian",

  /* ================= MOBILE ================= */
  reactnative: "logos:react",
  flutter: "logos:flutter",
  android: "logos:android-icon",
  ios: "logos:apple",
  swiftui: "logos:swift",
  kotlinandroid: "logos:kotlin",

  /* ================= AI / ML / DATA ================= */
  machinelearning: "logos:tensorflow",
  deeplearning: "logos:tensorflow",
  artificialintelligence: "logos:openai-icon",
  tensorflow: "logos:tensorflow",
  pytorch: "logos:pytorch-icon",
  keras: "logos:keras",
  scikitlearn: "logos:scikit-learn",
  pandas: "logos:pandas",
  numpy: "logos:numpy",
  opencv: "logos:opencv",
  nlp: "logos:openai-icon",
  computervision: "logos:opencv",
  datascience: "logos:python",

  /* ================= TESTING ================= */
  jest: "logos:jest",
  mocha: "logos:mocha",
  chai: "logos:chai",
  cypress: "logos:cypress",
  playwright: "logos:playwright",
  selenium: "logos:selenium",

  /* ================= TOOLS ================= */
  git: "logos:git-icon",
  github: "logos:github-icon",
  gitlab: "logos:gitlab-icon",
  bitbucket: "logos:bitbucket",
  vscode: "logos:visual-studio-code",
  intellij: "logos:intellij-idea",
  figma: "logos:figma",
  postman: "logos:postman-icon",
  jira: "logos:jira",
  confluence: "logos:confluence",
  slack: "logos:slack-icon",
  trello: "logos:trello",
  notion: "logos:notion-icon",

  /* ================= BLOCKCHAIN ================= */
  blockchain: "logos:blockchain",
  solidity: "logos:solidity",
  web3: "logos:web3js",
  ethereum: "logos:ethereum",
  metamask: "logos:metamask-icon",

  /* ================= GAME / GRAPHICS ================= */
  unity: "logos:unity",
  unrealengine: "logos:unreal-engine",
  blender: "logos:blender",
  threejs: "logos:threejs",

  /* ================= OTHER ================= */
  ethicalhacking: "mdi:shield-lock",
  cybersecurity: "mdi:shield-check",
  penetrationtesting: "mdi:bug-check",
  networksecurity: "mdi:shield-network",
  networking: "mdi:lan",
  iot: "mdi:chip",
  microservices: "mdi:cube-outline",
};


export const getSkillIcon = (skill) => {
  if (!skill) return "mdi:tools";

  const key = skill
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/\./g, "")
    .replace(/\+/g, "plus")
    .replace(/#/g, "sharp");

  return skillIconMap[key] || "mdi:tools";
};

